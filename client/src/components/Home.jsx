import React from "react";
import * as Icons from "@heroicons/react/24/outline";

function Home({ onSelect }) {
  const cards = [
    {
      key: "weather",
      icon: <Icons.SunIcon className="h-14 w-14 text-yellow-500 drop-shadow" />,
      title: "Weather Forecast",
      description: "Get precise weather details for your area. Plan sowing & harvest.",
    },
    {
      key: "farms",
      icon: <Icons.RectangleGroupIcon className="h-14 w-14 text-indigo-500 drop-shadow" />,
      title: "Farm Monitoring",
      description: "Track farms with interactive maps and detailed data.",
    },
    {
      key: "recommendations",
      icon: <Icons.ChartBarSquareIcon className="h-14 w-14 text-amber-400 drop-shadow" />,
      title: "Crop Recommendations",
      description: "Get personalized advice on crops and fertilizers.",
    },
    {
      key: "price-tracking",
      icon: <Icons.CurrencyDollarIcon className="h-14 w-14 text-purple-600 drop-shadow" />,
      title: "Market Rates",
      description: "Stay updated with daily market prices.",
    },
    {
      key: "voice-query",
      icon: <Icons.MicrophoneIcon className="h-14 w-14 text-pink-500 drop-shadow" />,
      title: "Voice & AI Query",
      description: "Ask questions naturally and get AI-powered answers.",
    },
    {
      key: "feedback",
      icon: <Icons.ChatBubbleLeftEllipsisIcon className="h-14 w-14 text-gray-500 drop-shadow" />,
      title: "Feedback & Support",
      description: "Help us improve by sending your feedback.",
    },
  ];

  // On card click, call onSelect of parent with the key.
  const handleCardClick = (key) => {
    if (typeof onSelect === "function") {
      onSelect(key);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-12 text-white">
      {/* Navbar or header can be placed here if needed */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 pt-24">
        {cards.map((card) => (
          <button
            key={card.key}
            onClick={() => handleCardClick(card.key)}
            className="flex flex-col bg-white bg-opacity-10 rounded-2xl p-12 items-center shadow-lg border border-gray-700 hover:bg-white/20 hover:border-indigo-500 transition duration-300 focus:outline-none"
            style={{ minHeight: "340px" }}
            aria-label={`Go to ${card.title}`}
          >
            <div className="mb-6">{card.icon}</div>
            <h2 className="text-2xl font-semibold mb-4 tracking-tight">{card.title}</h2>
            <p className="text-gray-300 text-center flex-grow leading-relaxed">{card.description}</p>
            <div className="mt-8 text-indigo-400 font-bold text-lg underline text-right w-full cursor-pointer">
              Explore &rarr;
            </div>
          </button>
        ))}
      </main>
    </div>
  );
}

export default Home;
