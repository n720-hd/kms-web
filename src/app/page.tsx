"use client";
import React, { useState } from "react";
import {
  Search,
  ArrowRight,
  Play,
  Award,
  MessageSquare,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import instance from "@/utils/axiosInstance";
import QuestionCard from "@/Components/QuestionCard";

const Home = () => {
  const [activeTab, setActiveTab] = useState("Standard");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();


  const suggestedQueries = [
    "How does climate change impact biodiversity?",
    "Why are aging Covid patients more susceptible to"
  ];

  // Fetch default questions for landing page display
  const { data: defaultQuestions, isLoading: isDefaultLoading } = useQuery({
    queryKey: ["questions"],
    queryFn: async () => {
      const res = await instance.get("/question", {params: {sortBy: 'rating'}});
      return res.data.data;
    },
  });
  
  // Handle search - navigate to search page
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    const searchParams = new URLSearchParams({
      search: searchQuery.trim(),
    });
    
    // Add active tab as a parameter if needed
    if (activeTab !== "Standard") {
      searchParams.append("type", activeTab.toLowerCase().replace(" ", "_"));
    }
    
    router.push(`/questions?${searchParams.toString()}`);
  };

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSuggestedQuery = (query: string) => {
    setSearchQuery(query);
    // Auto-navigate to search page with suggested query
    const searchParams = new URLSearchParams({
      search: query,
    });
    
    if (activeTab !== "Standard") {
      searchParams.append("type", activeTab.toLowerCase().replace(" ", "_"));
    }
    
    router.push(`/questions?${searchParams.toString()}`);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  // Use default questions or fallback to mock data
  const questionsToShow = defaultQuestions?.data || [];

  // Mock data for fallback
  const mockQuestions = [
    {
      question_id: 1,
      title: "How to implement machine learning algorithms in healthcare?",
      content: "I'm researching the application of ML algorithms in medical diagnosis and treatment planning...",
      tags: [{ tag_id: 1, name: "machine-learning" }, { tag_id: 2, name: "healthcare" }],
      answers_count: 5,
      likes_count: 12
    },
    {
      question_id: 2,
      title: "Climate change effects on marine ecosystems",
      content: "What are the latest findings on how rising sea temperatures affect marine biodiversity?",
      tags: [{ tag_id: 3, name: "climate-change" }, { tag_id: 4, name: "marine-biology" }],
      answers_count: 8,
      likes_count: 15
    },
    {
      question_id: 3,
      title: "Quantum computing applications in cryptography",
      content: "Exploring the potential impact of quantum computers on current encryption methods...",
      tags: [{ tag_id: 5, name: "quantum-computing" }, { tag_id: 6, name: "cryptography" }],
      answers_count: 3,
      likes_count: 7
    }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section - Research Platform Style */}
        <section className="bg-gray-50 py-24 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                The Fastest Research Platform Ever
              </h1>
              <p className="text-xl text-gray-600 mb-12">
                All-in-one AI tools for students and researchers.
              </p>
              
              {/* Search Interface */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-3xl mx-auto">
                {/* Search Input */}
                <div className="relative mb-6">
                  <input
                    type="text"
                    placeholder="Enter your search query"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-4 text-lg border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-20"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-14 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                  <button 
                    onClick={handleSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-orange-500 text-white p-2 rounded-md hover:bg-orange-600 transition-colors"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Tabs */}
                

                {/* Suggested Queries */}
                <div className="text-left">
                  <p className="text-sm text-gray-600 mb-3">Try searching for:</p>
                  <div className="space-y-2">
                    {suggestedQueries.map((query, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestedQuery(query)}
                        className="flex items-center text-left text-sm text-gray-700 hover:text-orange-500 transition-colors"
                      >
                        <Search className="h-4 w-4 mr-2 text-gray-400" />
                        {query}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deep Review Info */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center text-sm text-gray-600">
                    <Play className="h-4 w-4 mr-2 text-blue-500" />
                    <span>
                      Introducing Deep-Review - Do systematic literature review in minutes.{" "}
                      <button className="text-blue-500 hover:text-blue-600 underline">
                        Know More
                      </button>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Questions Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Recent Research Questions
              </h2>
              <p className="text-gray-600">
                Explore the latest questions from our research community
              </p>
            </div>

            <div className="space-y-6 max-w-4xl mx-auto">
              {isDefaultLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : questionsToShow.length > 0 ? (
                questionsToShow.slice(0, 5).map((item: any) => (
                  <QuestionCard
                    key={item.question_id || item.id}
                    question={{
                      id: item.question_id || item.id,
                      title: item.title,
                      content: item.content,
                      status: item.status,
                      created_at: item.created_at,
                      creator: item.creator,
                      tags: item.tags || [],
                      likes_count: item.likes_count || 0,
                      comments_count: item.comments_count || 0,
                      answers_count: item.answers_count || 0,
                      has_accepted_answer: item.has_accepted_answer,
                      average_rating: item.average_rating
                    }}
                    onTagClick={(tagName) => {
                      router.push(`/questions?tags=${tagName}`);
                    }}
                    showSaveButton={false}
                    compact={true}
                  />
                ))
              ) : (
                // Fallback to mock data if API fails
                mockQuestions.map((item) => (
                  <QuestionCard
                    key={item.question_id}
                    question={{
                      id: item.question_id,
                      title: item.title,
                      content: item.content,
                      created_at: new Date().toISOString(),
                      tags: item.tags || [],
                      likes_count: item.likes_count || 0,
                      answers_count: item.answers_count || 0
                    }}
                    onTagClick={(tagName) => {
                      router.push(`/questions?tags=${tagName}`);
                    }}
                    showSaveButton={false}
                    compact={true}
                  />
                ))
              )}
            </div>

            {/* View More Button */}
            <div className="text-center mt-8">
              <button
                onClick={() => router.push('/questions')}
                className="px-6 py-3 bg-blue-100 text-blue-700 rounded-md font-medium hover:bg-blue-200 transition-colors"
              >
                View All Questions
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Powerful Research Tools
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need for comprehensive research and analysis
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="bg-orange-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Smart Search
                </h3>
                <p className="text-gray-600">
                  AI-powered search that understands context and delivers precise research results.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="bg-orange-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Quality Analysis
                </h3>
                <p className="text-gray-600">
                  Advanced algorithms ensure you get high-quality, peer-reviewed sources.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="bg-orange-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Deep Review
                </h3>
                <p className="text-gray-600">
                  Systematic literature reviews completed in minutes, not months.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-bold text-white mb-4">
                Research Platform
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm hover:text-white">
                    Search
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm hover:text-white">
                    Help
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold text-white mb-4">Tools</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm hover:text-white">
                    Standard Search
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm hover:text-white">
                    High Quality
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm hover:text-white">
                    Deep Review
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm hover:text-white">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold text-white mb-4">Connect</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm hover:text-white">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm hover:text-white">
                    Feedback
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-sm text-gray-400 text-center md:text-left md:flex md:justify-between">
            <p>© 2025 Research Platform. All rights reserved.</p>
            <p className="mt-2 md:mt-0">
              Made with ❤️ using Next.js and Tailwind CSS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;