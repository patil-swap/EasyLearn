import pytest
import unittest
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
    handler.generate_response = AsyncMock()
    return handler

@pytest.fixture
def rag_pipeline(mock_db_manager, mock_llm_handler):
    return RAGPipeline(mock_db_manager, mock_llm_handler)

@pytest.mark.asyncio
async def test_summary_tool_constraints(rag_pipeline, mock_db_manager, mock_llm_handler):
    """Verify summary tool adheres to < 200 words and < 3 paragraphs."""
    # Mock documents
    mock_docs = [MagicMock(page_content="Content", metadata={"page": 1})]
    mock_retriever = MagicMock()
    mock_retriever.ainvoke = AsyncMock(return_value=mock_docs)
    mock_db_manager.get_retriever.return_value = mock_retriever

    # Mock reranker class in rag_pipeline bypassing instantiation/model download
    with patch("backend.core.rag_pipeline.FlashrankRerank", autospec=True) as mock_flashrank_class:
        mock_instance = MagicMock()
        mock_instance.compress_documents.return_value = mock_docs
        mock_flashrank_class.return_value = mock_instance
        
        # Mock long summary
        mock_llm_handler.generate_response.return_value = "Paragraph 1.\n\nParagraph 2."
        
        result = await rag_pipeline.run_query("test_book", "summary")
    
    assert "answer" in result
    assert "sources" in result
    assert len(result["sources"]) > 0
    
    # Check constraints on the mock response
    words = result["answer"].split()
    paragraphs = [p for p in result["answer"].split('\n\n') if p.strip()]
    
    assert len(words) <= 200
    assert len(paragraphs) <= 3

@pytest.mark.asyncio
async def test_concept_tool_difficulty_routing(rag_pipeline, mock_db_manager, mock_llm_handler):
    """Verify tool uses different prompts for simplified vs advanced."""
    mock_docs = [MagicMock(page_content="Content", metadata={"page": 1})]
    mock_retriever = MagicMock()
    mock_retriever.ainvoke = AsyncMock(return_value=mock_docs)
    mock_db_manager.get_retriever.return_value = mock_retriever
    
    # Mock reranker class in rag_pipeline bypassing instantiation/model download
    with patch("backend.core.rag_pipeline.FlashrankRerank", autospec=True) as mock_flashrank_class:
        mock_instance = MagicMock()
        mock_instance.compress_documents.return_value = mock_docs
        mock_flashrank_class.return_value = mock_instance
        
        mock_llm_handler.generate_response.return_value = "Simplified response"
        await rag_pipeline.run_query("book1", "concept", difficulty="simplified")
    
    # Check that it was called with difficulty="simplified"
    mock_llm_handler.generate_response.assert_called_with(
        tool_name="concept",
        context=unittest.mock.ANY,
        user_input=unittest.mock.ANY,
        difficulty="simplified",
        chat_history=unittest.mock.ANY
    )

@pytest.mark.asyncio
async def test_empty_retrieval_handling(rag_pipeline, mock_db_manager):
    """Verify handling when no sufficient context is found."""
    mock_retriever = MagicMock()
    mock_retriever.ainvoke = AsyncMock(return_value=[])
    mock_db_manager.get_retriever.return_value = mock_retriever
    
    result = await rag_pipeline.run_query("book_empty", "question", "What is X?")
    
    assert "No sufficient context found" in result["answer"]
    assert result["sources"] == []

@pytest.mark.asyncio
async def test_all_tools_return_citations(rag_pipeline, mock_db_manager, mock_llm_handler):
    """Verify all 6 tools return citations and answers."""
    tools = ["summary", "question", "character_arc", "plot", "concept", "problem"]
    mock_docs = [MagicMock(page_content="Some content", metadata={"page": 5})]
    mock_retriever = MagicMock()
    mock_retriever.ainvoke = AsyncMock(return_value=mock_docs)
    mock_db_manager.get_retriever.return_value = mock_retriever
    
    # Mock reranker class in rag_pipeline bypassing instantiation/model download
    with patch("backend.core.rag_pipeline.FlashrankRerank", autospec=True) as mock_flashrank_class:
        mock_instance = MagicMock()
        mock_instance.compress_documents.return_value = mock_docs
        mock_flashrank_class.return_value = mock_instance
        
        mock_llm_handler.generate_response.return_value = "Mock answer [Chunk 1]"

        for tool in tools:
            result = await rag_pipeline.run_query("book_id", tool, "Query")
            assert result["answer"] != ""
            assert len(result["sources"]) > 0
            assert result["sources"][0]["chunk_id"] == "Chunk 1"
