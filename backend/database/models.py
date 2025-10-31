from datetime import datetime
from .config import db

class BaseModel:
    """
    Base model with common fields and methods
    """
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        """
        Convert model instance to dictionary
        """
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }

    def save(self):
        """
        Save the model instance to database
        """
        db.session.add(self)
        db.session.commit()
        return self

    def delete(self):
        """
        Delete the model instance from database
        """
        db.session.delete(self)
        db.session.commit()

# Example models - Add your models here
# You can create specific models for your trading data, strategies, etc.

class AlgorithmResult(db.Model, BaseModel):
    """
    Model to store algorithm execution results
    """
    __tablename__ = 'algorithm_results'
    
    symbol = db.Column(db.String(50), nullable=False, index=True)
    algo_name = db.Column(db.String(100), nullable=False)
    lp_date = db.Column(db.Date, nullable=True)
    hp_date = db.Column(db.Date, nullable=True)
    lp_price = db.Column(db.Float, nullable=True)
    hp_price = db.Column(db.Float, nullable=True)
    percentage_increase = db.Column(db.Float, nullable=True)
    percentage_from_bp_to_today = db.Column(db.Float, nullable=True)
    
    # Additional metadata
    stock_file = db.Column(db.String(255), nullable=True)
    algo_params = db.Column(db.JSON, nullable=True)
    
    def __repr__(self):
        return f'<AlgorithmResult {self.symbol} - {self.algo_name}>'

# Add more models as needed for your application

