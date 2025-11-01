from datetime import datetime
from database.config import db
from .baseModel import BaseModel


#Association table for many-to-many relationship between StockList and StockItem
stock_list_items = db.Table(
    "stock_list_items",
    db.Column("stock_list_id", db.Integer, db.ForeignKey("stock_lists.id"), primary_key=True),
    db.Column("stock_item_id", db.Integer, db.ForeignKey("stock_items.id"), primary_key=True)
)


class StockList(BaseModel):
    __tablename__ = "stock_lists"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)

    # Many-to-many relationship via the association table
    stocks = db.relationship(
        "StockItem",
        secondary=stock_list_items,        
        back_populates="lists"             
    )

    def __repr__(self):
        return f"<StockList {self.name}>"


class StockItem(BaseModel):
    __tablename__ = "stock_items"

    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(20), unique=True, nullable=False)

    # Reverse many-to-many relationship
    lists = db.relationship(
        "StockList",
        secondary=stock_list_items,      
        back_populates="stocks"
    )

    def __repr__(self):
        return f"<StockItem {self.symbol}>"


