'use client';

import { useRouter } from 'next/navigation';
import { Search, Sparkles, Zap, BookOpen, ArrowRight, Github } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src="/knowsphere-logo.svg" alt="KnowSphere" className="h-10 w-10" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                KnowSphere
              </span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">How It Works</a>
              <a href="https://github.com/tejuiceB/KnowSphere" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                <Github className="h-5 w-5" />
                <span>GitHub</span>
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            <span>Powered by Elasticsearch + Google Gemini AI</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            AI-Powered
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Knowledge Discovery</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Transform academic research with intelligent conversational search. Ask questions naturally, get cited answers instantly.
          </p>

          <button
            onClick={() => router.push('/search')}
            className="group inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <span>Start Exploring</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-sm text-gray-500 mt-4">No sign-up required • 2000+ papers indexed</p>
        </div>

        {/* Hero Image/Illustration */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8">
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 text-left">
              <div className="flex items-start space-x-3 mb-4">
                <Search className="h-6 w-6 text-blue-600 mt-1" />
                <div className="flex-1">
                  <p className="text-gray-700 font-medium mb-2">What are the latest advances in transformer architectures?</p>
                  <div className="bg-white rounded-lg p-4 text-sm text-gray-600 border border-gray-200">
                    <p className="mb-2">📊 <strong>Summary:</strong> Recent advances include efficient attention mechanisms, sparse transformers...</p>
                    <p className="text-blue-600">📚 Cited from 5 research papers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why KnowSphere?</h2>
            <p className="text-xl text-gray-600">Cutting-edge AI technology meets academic research</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Hybrid Search</h3>
              <p className="text-gray-600">
                Combines semantic understanding (ELSER) with keyword matching (BM25) for unmatched relevance.
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="bg-indigo-600 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Answers</h3>
              <p className="text-gray-600">
                Google Gemini AI generates comprehensive, cited responses with evidence from research papers.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="bg-purple-600 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Conversational Memory</h3>
              <p className="text-gray-600">
                Ask follow-up questions naturally. System remembers context throughout your research session.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Three simple steps to discovery</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Ask Naturally</h3>
              <p className="text-gray-600">
                Type your research question in plain language, just like talking to a colleague.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI Searches & Analyzes</h3>
              <p className="text-gray-600">
                Hybrid search finds relevant papers, AI synthesizes insights with citations.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Get Cited Answers</h3>
              <p className="text-gray-600">
                Receive comprehensive answers backed by evidence from academic papers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <BookOpen className="h-16 w-16 text-white mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Research?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join researchers worldwide using AI to accelerate knowledge discovery
          </p>
          <button
            onClick={() => router.push('/search')}
            className="group inline-flex items-center space-x-3 bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            <span>Get Started Now</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src="/knowsphere-logo.svg" alt="KnowSphere" className="h-8 w-8" />
                <span className="text-xl font-bold text-white">KnowSphere</span>
              </div>
              <p className="text-sm text-gray-400">
                AI-powered knowledge discovery for researchers worldwide.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><button onClick={() => router.push('/search')} className="hover:text-white transition-colors">Try Now</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Technology</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="https://www.elastic.co/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Elasticsearch</a></li>
                <li><a href="https://cloud.google.com/vertex-ai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Google Vertex AI</a></li>
                <li><a href="https://nextjs.org/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Next.js</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="https://github.com/tejuiceB/KnowSphere" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a></li>
                <li><a href="https://github.com/tejuiceB/KnowSphere#readme" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="https://github.com/tejuiceB/KnowSphere/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">License</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © 2025 KnowSphere by Team Yoddha Universe. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="https://github.com/tejuiceB/KnowSphere" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <span className="text-sm text-gray-400">MIT License</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
