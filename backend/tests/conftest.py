import pytest
import tempfile
import shutil
import os
import warnings
from transformers import logging as hf_logging

def pytest_configure(config):
    """Suppress HuggingFace noise and specific warnings."""
    hf_logging.set_verbosity_error()
    warnings.filterwarnings("ignore", message=".*unauthenticated.*")
    warnings.filterwarnings("ignore", message=".*HF_TOKEN.*")

@pytest.fixture(autouse=True, scope="session")
def isolated_chroma_db(tmp_path_factory):
    """Redirect ChromaDB to a temporary directory during the entire test session."""
    tmp_dir = tmp_path_factory.mktemp("chroma_test_db")
    original = os.environ.get("CHROMA_DB_PATH")
    os.environ["CHROMA_DB_PATH"] = str(tmp_dir)
    
    yield str(tmp_dir)
    
    # Restore original environment
    if original:
        os.environ["CHROMA_DB_PATH"] = original
    else:
        os.environ.pop("CHROMA_DB_PATH", None)
    
    # Clean up temp directory
    shutil.rmtree(str(tmp_dir), ignore_errors=True)
