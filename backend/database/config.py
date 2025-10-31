import os
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

db = SQLAlchemy()

def init_db(app):
    """
    Initialize database connection and create tables
    """
    # Get database connection string from environment variable
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        raise ValueError(
            "DATABASE_URL environment variable is not set. "
            "Please provide your Neon PostgreSQL connection string."
        )
    
    # Configure Flask app with database URI
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Neon PostgreSQL connection settings
    # Neon works better without connection pooling
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'poolclass': NullPool,
        # SSL is usually already in the connection string from Neon
    }
    
    # Initialize SQLAlchemy with Flask app
    db.init_app(app)
    
    # Create all tables
    with app.app_context():
        db.create_all()
        print("Database initialized and tables created successfully!")
    
    return db

