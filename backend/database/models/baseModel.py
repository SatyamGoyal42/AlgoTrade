from datetime import datetime
from database.config import db

class BaseModel:
    """
    Base model with common fields and methods
    """
    __abstract__ = True

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self, include_relationships=False):
        
        if not hasattr(self, "__table__"):
            raise AttributeError(f"{self.__class__.__name__} has no table associated with it.") 
        
        data = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                value = value.isoformat()  # convert to JSON-safe string
            data[column.name] = value

    # Optionally include related objects
        if include_relationships:
            for rel in self.__mapper__.relationships:
                related_value = getattr(self, rel.key)
                if related_value is None:
                    data[rel.key] = None
                elif isinstance(related_value, list):
                    data[rel.key] = [item.to_dict() for item in related_value]
                else:
                    data[rel.key] = related_value.to_dict()

        return data
    
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
