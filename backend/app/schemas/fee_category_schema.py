from pydantic import BaseModel

class FeeCategoryBase(BaseModel):
    category_name: str

class FeeCategoryCreate(FeeCategoryBase):
    pass

class FeeCategorySchema(FeeCategoryBase):
    category_id: int

    class Config:
        from_attributes = True
