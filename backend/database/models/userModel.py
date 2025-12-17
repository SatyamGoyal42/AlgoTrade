from datetime import datetime
from database.config import db
from .baseModel import BaseModel


class User(BaseModel):
    """
    Represents an authenticated user sourced from Google OAuth.
    """

    __tablename__ = "users"

    google_id = db.Column(db.String(255), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=True)
    picture = db.Column(db.String(512), nullable=True)
    locale = db.Column(db.String(32), nullable=True)
    last_login_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    stock_lists = db.relationship(
        "StockList",
        back_populates="owner",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )

    algorithm_results = db.relationship(
        "AlgorithmResult",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )

    def touch_login(self):
        """
        Update the user's last_login_at timestamp.
        """
        self.last_login_at = datetime.utcnow()
        db.session.add(self)
        return self


