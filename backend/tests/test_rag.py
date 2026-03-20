import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from backend.core.rag_pipeline import RAGPipeline
from backend.core.llm_handler import LLMHandler
from backend.services.vector_db_manager import VectorDBManager

@pytest.fixture
def mock_db_manager():
    return MagicMock(spec=VectorDBManager)

@pytest.fixture
def mock_llm_handler():
    handler = MagicMock(spec=LLMHandler)
    handler.system_prompts = {"summary": "Summary prompt", "question": "QA prompt"}
    handler.generate_response = AsyncMock()
    return handler

@pytest.fixture
def rag_pipeline(mock_db_manager, mock_llm_handler):
    return RAGPipeline(mock_db_manager, mock_llm_handler)

def test_memory_resets_on_new_book(rag_pipeline):
    """Verify that calling get_memory for a new book_id provides an empty history."""
    mem1 = rag_pipeline.get_memory("book1")
    mem1.add_user_message("Hello")
    
    # Get memory for a DIFFERENT book
    mem2 = rag_pipeline.get_memory("book2")
    assert len(mem2.messages) == 0
    assert len(mem1.messages) == 1

@pytest.mark.asyncio
async def test_memory_injection_into_prompt(rag_pipeline, mock_llm_handler, mock_db_manager):
    """Verify that prior chat history is passed to the LLM during generation."""
    book_id = "book_mem"
    mem = rag_pipeline.get_memory(book_id)
    mem.add_user_message("Prev User")
    mem.add_ai_message("Prev AI")
    
    mock_retriever = MagicMock()
    mock_retriever.ainvoke = AsyncMock(return_value=[MagicMock(page_content="Context", metadata={})])
    mock_db_manager.get_retriever.return_value = mock_retriever
    
    # Use robust class-level patch with autospec=True to bypass real instantiation
    with patch("backend.core.rag_pipeline.FlashrankRerank", autospec=True) as mock_flashrank_class:
        mock_instance = MagicMock()
        mock_instance.compress_documents.return_value = [MagicMock(page_content="Context", metadata={})]
        mock_flashrank_class.return_value = mock_instance
        
        mock_llm_handler.generate_response.return_value = "Mocked answer"
        await rag_pipeline.run_query(book_id, "question", "Current query")
    
    # Check that generate_response was called with chat_history containing the previous messages
    assert mock_llm_handler.generate_response.called
    args, kwargs = mock_llm_handler.generate_response.call_args
    history = kwargs["chat_history"]
    assert any(m.content == "Prev User" for m in history)
    assert any(m.content == "Prev AI" for m in history)

@pytest.mark.asyncio
async def test_reranker_and_mmr_usage(rag_pipeline, mock_db_manager, mock_llm_handler):
    """Verify that retrieval uses MMR and is followed by Flashrank reranking."""
    # 1. MMR Check
    mock_retriever = MagicMock()
    mock_retriever.ainvoke = AsyncMock(return_value=[MagicMock(page_content="C", metadata={})] * 30)
    mock_db_manager.get_retriever.return_value = mock_retriever
    
    mock_llm_handler.generate_response.return_value = "Answer"
    
    # 2. Flashrank Check
    with patch("backend.core.rag_pipeline.FlashrankRerank", autospec=True) as mock_flashrank_class:
        mock_instance = MagicMock()
        mock_instance.compress_documents.return_value = [MagicMock(page_content="Reranked", metadata={})] * 8
        mock_flashrank_class.return_value = mock_instance
        
        await rag_pipeline.run_query("book_rerank", "summary")
        
        # Verify initial retrieval was for 30 docs
        mock_db_manager.get_retriever.assert_called_with("book_rerank", k=30, lambda_mult=pytest.approx(0.3))
        
        # Verify reranker was instantiated and called
        assert mock_flashrank_class.called
        assert mock_instance.compress_documents.called
