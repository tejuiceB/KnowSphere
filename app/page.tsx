import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-8">
          <img src="/knowsphere-logo.svg" alt="KnowSphere" className="w-32 h-32 md:w-48 md:h-48 animate-pulse" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          KnowSphere
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-700 mb-4 max-w-3xl mx-auto font-medium">
          AI-Powered Knowledge Discovery Platform
        </p>
        
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          Transform your research workflow with intelligent hybrid search and conversational AI that finds, reads, and synthesizes academic papers in seconds.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/search">
            <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all shadow-lg">
              🚀 Start Exploring
            </button>
          </Link>
          <a href="https://github.com/tejuiceB/KnowSphere" target="_blank" rel="noopener noreferrer">
            <button className="px-8 py-4 bg-white text-gray-800 text-lg font-semibold rounded-lg hover:bg-gray-100 transform hover:scale-105 transition-all shadow-lg border-2 border-gray-200">
              ⭐ View on GitHub
            </button>
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          Why Choose KnowSphere?
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow border border-gray-100">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Hybrid Search</h3>
            <p className="text-gray-600">
              Combines semantic understanding (ELSER) with precise keyword matching (BM25) for optimal results.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow border border-gray-100">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Conversational AI</h3>
            <p className="text-gray-600">
              Ask questions naturally and get context-aware responses powered by Google Gemini 2.0 Flash.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow border border-gray-100">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Smart Citations</h3>
            <p className="text-gray-600">
              Every answer backed by relevant papers with inline citations and source links.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow border border-gray-100">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Lightning Fast</h3>
            <p className="text-gray-600">
              Get comprehensive answers in under 3 seconds, searching through thousands of papers.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16 bg-white rounded-2xl shadow-xl my-8">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          How It Works
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Ask Your Question</h3>
            <p className="text-gray-600">
              Type your research question in natural language - no special syntax required.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-purple-600">2</span>
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">AI Searches & Analyzes</h3>
            <p className="text-gray-600">
              Our hybrid search finds relevant papers and AI reads them to understand the content.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-600">3</span>
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Get Synthesized Answer</h3>
            <p className="text-gray-600">
              Receive a comprehensive answer with citations, comparisons, and key insights.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl font-bold mb-2">2000+</div>
            <div className="text-lg">Research Papers</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl font-bold mb-2">&lt;3s</div>
            <div className="text-lg">Response Time</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl font-bold mb-2">95%</div>
            <div className="text-lg">Time Saved</div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl font-bold mb-2">∞</div>
            <div className="text-lg">Paper Additions</div>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="container mx-auto px-4 py-16 bg-gray-50 rounded-2xl my-8">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          Powered By Leading Technologies
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <div className="text-5xl mb-4">🔷</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Elasticsearch</h3>
            <p className="text-gray-600">ELSER v2 semantic search with BM25 hybrid ranking</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Google Vertex AI</h3>
            <p className="text-gray-600">Gemini 2.0 Flash for intelligent response generation</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Next.js</h3>
            <p className="text-gray-600">Modern React framework with TypeScript</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-12 rounded-2xl shadow-2xl">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Research?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join researchers worldwide who are accelerating their literature reviews with KnowSphere
          </p>
          <Link href="/search">
            <button className="px-10 py-5 bg-white text-blue-600 text-xl font-bold rounded-lg hover:bg-gray-100 transform hover:scale-105 transition-all shadow-lg">
              Start Exploring Now →
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600 border-t border-gray-200">
        <p className="mb-2">
          Built with ❤️ by Team Yoddha Universe
        </p>
        <p className="text-sm">
          Open source • MIT License • 
          <a href="https://github.com/tejuiceB/KnowSphere" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
            GitHub
          </a>
        </p>
      </footer>
    </main>
  );
}
