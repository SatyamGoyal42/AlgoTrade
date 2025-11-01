from datetime import datetime
from database.config import db
from .baseModel import BaseModel

class AlgorithmResult(BaseModel):
    __tablename__ = "algorithm_results"
    symbol = db.Column(db.String(50), nullable=False, index=True)
    algo_name = db.Column(db.String(100), nullable=False)
    lp_date = db.Column(db.Date, nullable=True)
    hp_date = db.Column(db.Date, nullable=True)
    lp_price = db.Column(db.Float, nullable=True)
    hp_price = db.Column(db.Float, nullable=True)
    percentage_increase = db.Column(db.Float, nullable=True)
    percentage_from_bp_to_today = db.Column(db.Float, nullable=True)
    stock_list_id = db.Column(db.Integer, db.ForeignKey("stock_lists.id"), nullable=True)
    algo_params = db.Column(db.JSON, nullable=True)
