from fastapi import APIRouter

from api.handlers import embed, parse, consolidate


api_router = APIRouter()

api_router.post("/embed")(embed.embed)
api_router.post("/parse")(parse.parse)
api_router.post("/consolidate")(consolidate.consolidate)

