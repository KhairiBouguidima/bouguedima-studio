import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

# Mock db_cursor before importing app to avoid database connection on import
with patch("db.psycopg.connect") as mock_connect:
    from main import app

client = TestClient(app)

def test_list_services():
    """Test public endpoint fetching the list of services."""
    mock_services = [
        {"id": 1, "n": "01", "t": "Service 1", "d": "Description 1", "tag": "Tag 1", "sort_order": 0}
    ]
    
    with patch("main.db_cursor") as mock_db_cursor:
        mock_cur = MagicMock()
        mock_cur.fetchall.return_value = mock_services
        mock_db_cursor.return_value.__enter__.return_value = mock_cur
        
        response = client.get("/api/services")
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["t"] == "Service 1"
        mock_cur.execute.assert_called_once_with("SELECT * FROM services ORDER BY sort_order")

def test_list_categories():
    """Test public endpoint fetching the list of categories."""
    mock_categories = [
        {"id": 1, "name": "Category 1", "desc": "Desc 1", "price_per_meter": 100, "sort_order": 0}
    ]
    
    with patch("main.db_cursor") as mock_db_cursor:
        mock_cur = MagicMock()
        mock_cur.fetchall.return_value = mock_categories
        mock_db_cursor.return_value.__enter__.return_value = mock_cur
        
        response = client.get("/api/categories")
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["name"] == "Category 1"
        mock_cur.execute.assert_called_once_with("SELECT * FROM categories ORDER BY sort_order")

def test_list_projects():
    """Test public endpoint fetching public projects."""
    mock_projects = [
        {"id": "p1", "title": "Project 1", "cat": "Cat 1", "sub": "Sub 1", "loc": "Loc 1", "img": "img1.jpg", "live": 1}
    ]
    
    with patch("main.db_cursor") as mock_db_cursor:
        mock_cur = MagicMock()
        mock_cur.fetchall.return_value = mock_projects
        mock_db_cursor.return_value.__enter__.return_value = mock_cur
        
        response = client.get("/api/projects")
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["title"] == "Project 1"
        mock_cur.execute.assert_called_once_with("SELECT * FROM projects WHERE live = 1")

def test_submit_quote():
    """Test submitting a quote (lead generation)."""
    mock_lead = {
        "id": 1,
        "name": "ياسمين",
        "initials": "يس",
        "project": "جدار مميز",
        "area": "20 م²",
        "style": "فينيسي",
        "status": "Lead",
        "created_at": "2026-07-21T11:15:00",
        "photos": 0,
        "photos_paths": "",
        "location": "",
        "budget": "—",
        "msg": "رسالة اختبار",
        "email": "test@test.com",
        "phone": "0555555555"
    }
    
    with patch("main.db_cursor") as mock_db_cursor:
        mock_cur = MagicMock()
        mock_cur.fetchone.side_effect = [{"id": 1}, mock_lead]
        mock_db_cursor.return_value.__enter__.return_value = mock_cur
        
        payload = {
            "name": "ياسمين",
            "email": "test@test.com",
            "phone": "0555555555",
            "type": "جدار مميز",
            "area": "20",
            "unit": "م²",
            "style": "فينيسي",
            "budget": "—",
            "message": "رسالة اختبار",
            "photos": 0,
            "photos_paths": ""
        }
        response = client.post("/api/quotes", json=payload)
        assert response.status_code == 200
        assert response.json()["name"] == "ياسمين"
        assert mock_cur.execute.call_count == 2
