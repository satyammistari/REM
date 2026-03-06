package qdrant

import (
	"context"
	"fmt"
	"net"
	"time"

	"rem/go-api/internal/config"

	qdrantpb "github.com/qdrant/go-client/qdrant"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"
)

type QdrantClient struct {
	conn        *grpc.ClientConn
	collections qdrantpb.CollectionsClient
	points      qdrantpb.PointsClient
	logger      *zap.Logger

	host string
	port int
}

func New(cfg *config.Config, logger *zap.Logger) (*QdrantClient, error) {
	addr := net.JoinHostPort(cfg.QdrantHost, fmt.Sprintf("%d", cfg.QdrantPort))

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	conn, err := grpc.DialContext(ctx, addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("connect qdrant grpc %s: %w", addr, err)
	}

	c := &QdrantClient{
		conn:        conn,
		collections: qdrantpb.NewCollectionsClient(conn),
		points:      qdrantpb.NewPointsClient(conn),
		logger:      logger,
		host:        cfg.QdrantHost,
		port:        cfg.QdrantPort,
	}

	return c, nil
}

func (c *QdrantClient) Close() error {
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

func (c *QdrantClient) Ping(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	_, err := c.collections.List(ctx, &qdrantpb.ListCollectionsRequest{})
	if err != nil {
		return err
	}
	return nil
}

func (c *QdrantClient) InitializeCollections(ctx context.Context) error {
	if err := c.ensureEpisodesCollection(ctx); err != nil {
		return err
	}
	if err := c.ensureSemanticCollection(ctx); err != nil {
		return err
	}
	return nil
}

type SearchResult struct {
	ID      string                 `json:"id"`
	Score   float32                `json:"score"`
	Payload map[string]interface{} `json:"payload"`
}

func (c *QdrantClient) ensureEpisodesCollection(ctx context.Context) error {
	err := c.createCollectionIfNotExists(ctx, "episodes", 1536)
	if err != nil {
		return err
	}

	// Payload indexes
	_ = c.createPayloadIndex(ctx, "episodes", "agent_id", qdrantpb.FieldType_FieldTypeKeyword)
	_ = c.createPayloadIndex(ctx, "episodes", "domain", qdrantpb.FieldType_FieldTypeKeyword)
	_ = c.createPayloadIndex(ctx, "episodes", "consolidated", qdrantpb.FieldType_FieldTypeBool)
	_ = c.createPayloadIndex(ctx, "episodes", "created_at", qdrantpb.FieldType_FieldTypeInteger)

	c.logger.Info("qdrant collection ready", zap.String("collection", "episodes"))
	return nil
}

func (c *QdrantClient) ensureSemanticCollection(ctx context.Context) error {
	err := c.createCollectionIfNotExists(ctx, "semantic_memories", 1536)
	if err != nil {
		return err
	}

	_ = c.createPayloadIndex(ctx, "semantic_memories", "agent_id", qdrantpb.FieldType_FieldTypeKeyword)
	_ = c.createPayloadIndex(ctx, "semantic_memories", "domain", qdrantpb.FieldType_FieldTypeKeyword)
	_ = c.createPayloadIndex(ctx, "semantic_memories", "fact_type", qdrantpb.FieldType_FieldTypeKeyword)

	c.logger.Info("qdrant collection ready", zap.String("collection", "semantic_memories"))
	return nil
}

func (c *QdrantClient) createCollectionIfNotExists(ctx context.Context, name string, vectorSize uint64) error {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	// Try to create; if it already exists, treat as success.
	_, err := c.collections.Create(ctx, &qdrantpb.CreateCollection{
		CollectionName: name,
		VectorsConfig: &qdrantpb.VectorsConfig{
			Config: &qdrantpb.VectorsConfig_Params{
				Params: &qdrantpb.VectorParams{
					Size:     vectorSize,
					Distance: qdrantpb.Distance_Cosine,
				},
			},
		},
		HnswConfig: &qdrantpb.HnswConfigDiff{
			M:           ptrUint64(16),
			EfConstruct: ptrUint64(100),
		},
		OnDiskPayload: ptrBool(false),
	})
	if err == nil {
		c.logger.Info("created qdrant collection", zap.String("collection", name))
		return nil
	}

	st, ok := status.FromError(err)
	if ok && st.Code().String() == "AlreadyExists" {
		c.logger.Info("qdrant collection already exists", zap.String("collection", name))
		return nil
	}

	// Some Qdrant versions return InvalidArgument with "already exists" text.
	if ok && (containsInsensitive(st.Message(), "already exists") || containsInsensitive(st.Message(), "exists")) {
		c.logger.Info("qdrant collection already exists", zap.String("collection", name))
		return nil
	}
	return fmt.Errorf("create collection %s: %w", name, err)
}

func (c *QdrantClient) createPayloadIndex(ctx context.Context, collection, field string, fieldType qdrantpb.FieldType) error {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	_, err := c.points.CreateFieldIndex(ctx, &qdrantpb.CreateFieldIndexCollection{
		CollectionName: collection,
		FieldName:      field,
		FieldType:      &fieldType,
		Wait:           ptrBool(true),
	})
	if err == nil {
		c.logger.Info("created qdrant payload index", zap.String("collection", collection), zap.String("field", field))
		return nil
	}

	st, ok := status.FromError(err)
	if ok && containsInsensitive(st.Message(), "already") {
		c.logger.Info("qdrant payload index already exists", zap.String("collection", collection), zap.String("field", field))
		return nil
	}

	return err
}

func (c *QdrantClient) UpsertEpisode(ctx context.Context, episodeID string, vector []float32, payload map[string]interface{}) error {
	return c.upsertPoint(ctx, "episodes", episodeID, vector, payload)
}

func (c *QdrantClient) UpsertSemanticMemory(ctx context.Context, semanticID string, vector []float32, payload map[string]interface{}) error {
	return c.upsertPoint(ctx, "semantic_memories", semanticID, vector, payload)
}

func (c *QdrantClient) upsertPoint(ctx context.Context, collection string, id string, vector []float32, payload map[string]interface{}) error {
	ctx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	pointID := &qdrantpb.PointId{
		PointIdOptions: &qdrantpb.PointId_Uuid{
			Uuid: id,
		},
	}

	_, err := c.points.Upsert(ctx, &qdrantpb.UpsertPoints{
		CollectionName: collection,
		Wait:           ptrBool(true),
		Points: []*qdrantpb.PointStruct{
			{
				Id:      pointID,
				Vectors: &qdrantpb.Vectors{VectorsOptions: &qdrantpb.Vectors_Vector{Vector: &qdrantpb.Vector{Data: vector}}},
				Payload: toPayload(payload),
			},
		},
	})
	if err != nil {
		return fmt.Errorf("qdrant upsert %s/%s: %w", collection, id, err)
	}
	return nil
}

func (c *QdrantClient) SearchEpisodes(ctx context.Context, queryVector []float32, agentID string, topK int, scoreThreshold float32) ([]SearchResult, error) {
	filter := &qdrantpb.Filter{
		Must: []*qdrantpb.Condition{
			{
				ConditionOneOf: &qdrantpb.Condition_Field{
					Field: &qdrantpb.FieldCondition{
						Key: "agent_id",
						Match: &qdrantpb.Match{
							MatchValue: &qdrantpb.Match_Keyword{Keyword: agentID},
						},
					},
				},
			},
		},
	}

	return c.search(ctx, "episodes", queryVector, filter, topK, scoreThreshold)
}

func (c *QdrantClient) SearchSemanticMemories(ctx context.Context, queryVector []float32, agentID string, topK int) ([]SearchResult, error) {
	filter := &qdrantpb.Filter{
		Must: []*qdrantpb.Condition{
			{
				ConditionOneOf: &qdrantpb.Condition_Field{
					Field: &qdrantpb.FieldCondition{
						Key: "agent_id",
						Match: &qdrantpb.Match{
							MatchValue: &qdrantpb.Match_Keyword{Keyword: agentID},
						},
					},
				},
			},
		},
	}

	return c.search(ctx, "semantic_memories", queryVector, filter, topK, 0)
}

func (c *QdrantClient) search(ctx context.Context, collection string, queryVector []float32, filter *qdrantpb.Filter, topK int, scoreThreshold float32) ([]SearchResult, error) {
	ctx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	req := &qdrantpb.SearchPoints{
		CollectionName: collection,
		Vector:         queryVector,
		Filter:         filter,
		Limit:          uint64(topK),
		WithPayload: &qdrantpb.WithPayloadSelector{
			SelectorOptions: &qdrantpb.WithPayloadSelector_Enable{Enable: true},
		},
		WithVectors: &qdrantpb.WithVectorsSelector{
			SelectorOptions: &qdrantpb.WithVectorsSelector_Enable{Enable: false},
		},
	}
	if scoreThreshold > 0 {
		req.ScoreThreshold = &scoreThreshold
	}

	resp, err := c.points.Search(ctx, req)
	if err != nil {
		return nil, err
	}

	results := make([]SearchResult, 0, len(resp.Result))
	for _, r := range resp.Result {
		results = append(results, SearchResult{
			ID:      pointIDToString(r.Id),
			Score:   r.Score,
			Payload: fromPayload(r.Payload),
		})
	}
	return results, nil
}

func pointIDToString(id *qdrantpb.PointId) string {
	if id == nil {
		return ""
	}
	switch v := id.PointIdOptions.(type) {
	case *qdrantpb.PointId_Uuid:
		return v.Uuid
	case *qdrantpb.PointId_Num:
		return fmt.Sprintf("%d", v.Num)
	default:
		return ""
	}
}

func toPayload(m map[string]interface{}) map[string]*qdrantpb.Value {
	out := make(map[string]*qdrantpb.Value, len(m))
	for k, v := range m {
		out[k] = interfaceToValue(v)
	}
	return out
}

func fromPayload(p map[string]*qdrantpb.Value) map[string]interface{} {
	out := make(map[string]interface{}, len(p))
	for k, v := range p {
		out[k] = valueToInterface(v)
	}
	return out
}

func interfaceToValue(v interface{}) *qdrantpb.Value {
	switch t := v.(type) {
	case string:
		return &qdrantpb.Value{Kind: &qdrantpb.Value_StringValue{StringValue: t}}
	case bool:
		return &qdrantpb.Value{Kind: &qdrantpb.Value_BoolValue{BoolValue: t}}
	case int:
		return &qdrantpb.Value{Kind: &qdrantpb.Value_IntegerValue{IntegerValue: int64(t)}}
	case int64:
		return &qdrantpb.Value{Kind: &qdrantpb.Value_IntegerValue{IntegerValue: t}}
	case float64:
		return &qdrantpb.Value{Kind: &qdrantpb.Value_DoubleValue{DoubleValue: t}}
	case float32:
		return &qdrantpb.Value{Kind: &qdrantpb.Value_DoubleValue{DoubleValue: float64(t)}}
	default:
		return &qdrantpb.Value{Kind: &qdrantpb.Value_NullValue{NullValue: qdrantpb.NullValue_NULL_VALUE}}
	}
}

func valueToInterface(v *qdrantpb.Value) interface{} {
	if v == nil {
		return nil
	}
	switch k := v.Kind.(type) {
	case *qdrantpb.Value_StringValue:
		return k.StringValue
	case *qdrantpb.Value_IntegerValue:
		return k.IntegerValue
	case *qdrantpb.Value_DoubleValue:
		return k.DoubleValue
	case *qdrantpb.Value_BoolValue:
		return k.BoolValue
	default:
		return nil
	}
}

func containsInsensitive(haystack, needle string) bool {
	if haystack == "" || needle == "" {
		return false
	}
	return stringsContainsFold(haystack, needle)
}

func stringsContainsFold(s, substr string) bool {
	// Simple fold contains to avoid pulling strings for one helper.
	ls := len(s)
	lsub := len(substr)
	if lsub == 0 || ls < lsub {
		return false
	}
	for i := 0; i <= ls-lsub; i++ {
		if equalFoldASCII(s[i:i+lsub], substr) {
			return true
		}
	}
	return false
}

func ptrBool(v bool) *bool       { return &v }
func ptrUint64(v uint64) *uint64 { return &v }

func equalFoldASCII(a, b string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := 0; i < len(a); i++ {
		aa := a[i]
		bb := b[i]
		if aa == bb {
			continue
		}
		// to lower for A-Z
		if 'A' <= aa && aa <= 'Z' {
			aa += 'a' - 'A'
		}
		if 'A' <= bb && bb <= 'Z' {
			bb += 'a' - 'A'
		}
		if aa != bb {
			return false
		}
	}
	return true
}

