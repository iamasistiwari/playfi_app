from pydantic import BaseModel
from typing import List, Optional


class ViewCount(BaseModel):
    text: Optional[str] = ""
    short: Optional[str] = ""


class Thumbnail(BaseModel):
    url: str
    width: int
    height: int


class DescriptionText(BaseModel):
    text: str
    bold: Optional[bool] = None


class Channel(BaseModel):
    name: str
    id: str
    thumbnails: List[Thumbnail]
    link: str


class Accessibility(BaseModel):
    title: str
    duration: str


class YoutubeVideoType(BaseModel):
    type: str
    id: str
    title: str
    publishedTime: str
    duration: str
    viewCount: ViewCount
    thumbnails: List[Thumbnail]
    richThumbnail: Optional[Thumbnail] = None
    channel: Channel
    accessibility: Accessibility
    link: str
