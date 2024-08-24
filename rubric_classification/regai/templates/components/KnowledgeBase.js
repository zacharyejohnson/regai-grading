import React, { useState, useEffect } from 'react';
import api from "../../../regai-frontend/src/components/utils/api";

function KnowledgeBase() {
  const [knowledgeBaseItems, setKnowledgeBaseItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchKnowledgeBaseItems();
  }, []);

  const fetchKnowledgeBaseItems = () => {
    api.get('/knowledge-base/')
      .then(response => setKnowledgeBaseItems(response.data))
      .catch(error => console.error('Error fetching knowledge base items:', error));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    api.get(`/knowledge-base/search/?query=${searchQuery}`)
      .then(response => setKnowledgeBaseItems(response.data))
      .catch(error => console.error('Error searching knowledge base:', error));
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6">Knowledge Base</h1>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search knowledge base..."
            className="flex-grow px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Knowledge Base Items
            </h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {knowledgeBaseItems.map(item => (
              <li
                key={item.id}
                className="px-4 py-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleItemClick(item)}
              >
                <div className="text-sm font-medium text-gray-900">{item.title}</div>
                <div className="text-sm text-gray-500">{item.type}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          {selectedItem ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {selectedItem.title}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Type: {selectedItem.type}
                </p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">
                      Content
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {selectedItem.content}
                    </dd>
                  </div>
                  {selectedItem.type === 'rubric' && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">
                        Rubric Details
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <pre>{JSON.stringify(selectedItem.rubric, null, 2)}</pre>
                      </dd>
                    </div>
                  )}
                  {selectedItem.type === 'evaluation' && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">
                        Evaluation Details
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <p>Score: {selectedItem.evaluation.score}</p>
                        <p>Feedback: {selectedItem.evaluation.feedback}</p>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
              <p className="text-gray-500">Select an item from the knowledge base to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default KnowledgeBase;