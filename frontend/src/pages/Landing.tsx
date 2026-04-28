import { useNavigate } from "react-router-dom";
import { 
  BrainCircuit, 
  Mic, 
  FileText, 
  ArrowRight, 
  Users, 
  TrendingUp,
  Star,
  Sparkles,
  Zap,
  Menu,
  X
} from "lucide-react";
import { SignInButton, SignUpButton, useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";

export default function Landing() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Redirect to dashboard if user is signed in
  useEffect(() => {
    if (isSignedIn) {
      navigate('/dashboard');
    }
  }, [isSignedIn]);

  const navItems = [
    { label: "Features", href: "#features" },
    { label: "Success Stories", href: "#testimonials" },
    { label: "About", href: "#about" },
    { label: "Pricing", href: "#pricing" }
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const features = [
    {
      icon: BrainCircuit,
      title: "AI MCQ Practice",
      description: "Test your knowledge with adaptive multiple-choice questions and instant feedback",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Mic,
      title: "Live Voice Interviews",
      description: "Practice real conversations with AI interviewer Alex Morgan and get detailed feedback",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: FileText,
      title: "Resume Review",
      description: "Upload your resume for professional analysis and improvement suggestions",
      gradient: "from-green-500 to-emerald-500"
    }
  ];

  const stats = [
    { label: "Questions Answered", value: "10K+", icon: BrainCircuit },
    { label: "Users Trained", value: "500+", icon: Users },
    { label: "Success Rate", value: "95%", icon: TrendingUp },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer",
      content: "This platform helped me ace my technical interviews. The AI feedback is incredibly accurate.",
      rating: 5
    },
    {
      name: "Mike Johnson",
      role: "Frontend Developer",
      content: "The voice practice feature boosted my confidence. I went from nervous to natural in weeks.",
      rating: 5
    },
    {
      name: "Emily Davis",
      role: "Full Stack Developer",
      content: "The progress tracking kept me motivated. Seeing improvement every day made all the difference.",
      rating: 5
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute inset-0 bg-gradient-radial from-primary-500/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-radial from-secondary-500/10 via-transparent to-transparent" />
      
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex items-center justify-between p-6 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Interview Coach</h1>
              <p className="text-xs text-slate-400">AI-Powered Practice</p>
            </div>
          </div>
          
          {/* Desktop Navigation Menu */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollToSection(item.href)}
                className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Auth Buttons & Mobile Menu */}
          <div className="flex items-center gap-4">
            <SignInButton mode="modal">
              <button className="text-slate-300 hover:text-white transition-colors">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-white font-medium hover:shadow-lg transition-all duration-200">
                Get Started
              </button>
            </SignUpButton>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-sm">
            <nav className="px-6 py-4 space-y-3">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollToSection(item.href)}
                  className="block w-full text-left text-slate-300 hover:text-white transition-colors text-sm font-medium py-2"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Hero Section */}
        <section className="px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30 px-4 py-2 text-sm text-blue-300 mb-12">
                <Sparkles className="h-4 w-4" />
                AI-Powered Interview Practice
              </div>
              
              <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-8xl leading-tight">
                Your Personal
                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Interview Coach
                </span>
              </h1>
              
              <p className="mx-auto mt-8 max-w-3xl text-xl text-slate-300 leading-relaxed">
                Practice technical interviews with AI. Get real-time feedback on MCQs, voice conversations, and resume reviews.
              </p>
              
              <div className="mt-12 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
                <SignUpButton mode="modal">
                  <button className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-10 py-4 text-lg text-white font-semibold hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300">
                    <Zap className="h-5 w-5" />
                    Start Practicing
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </SignUpButton>
                
                <SignInButton mode="modal">
                  <button className="rounded-xl border border-slate-700 px-10 py-4 text-lg text-slate-300 font-medium hover:bg-slate-800 hover:border-slate-600 transition-all duration-300">
                    Sign In
                  </button>
                </SignInButton>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="mt-4 text-3xl font-bold text-white">{stat.value}</div>
                    <div className="mt-1 text-sm text-slate-400">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Everything You Need to Succeed
              </h2>
              <p className="mt-4 text-lg text-slate-300">
                Our AI-powered platform adapts to your learning style and pace
              </p>
            </div>
            
            <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="group text-center">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${feature.gradient} mx-auto`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-slate-300">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Success Stories
              </h2>
              <p className="mt-4 text-lg text-slate-300">
                See how our platform helped developers land their dream jobs
              </p>
            </div>
            
            <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="mt-4 text-slate-300">"{testimonial.content}"</p>
                  <div className="mt-6">
                    <div className="font-medium text-white">{testimonial.name}</div>
                    <div className="text-sm text-slate-400">{testimonial.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                About Interview Coach
              </h2>
              <p className="mt-4 text-lg text-slate-300">
                We're dedicated to helping developers master their technical interviews through AI-powered practice
              </p>
            </div>
            
            <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white mb-4">Our Mission</h3>
                <p className="text-slate-300 leading-relaxed">
                  To democratize interview preparation by providing accessible, intelligent practice tools that adapt to individual learning styles and help candidates build confidence.
                </p>
              </div>
              
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white mb-4">Our Technology</h3>
                <p className="text-slate-300 leading-relaxed">
                  Powered by advanced AI models, our platform analyzes responses in real-time, provides personalized feedback, and simulates authentic interview experiences.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-4 text-lg text-slate-300">
                Choose the plan that works best for your interview preparation needs
              </p>
            </div>
            
            <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white mb-2">Free</h3>
                <p className="text-3xl font-bold text-white mb-4">$0<span className="text-lg font-normal text-slate-400">/month</span></p>
                <ul className="space-y-3 text-slate-300">
                  <li>• 5 MCQ tests per month</li>
                  <li>• Basic voice interviews</li>
                  <li>• Limited resume reviews</li>
                </ul>
              </div>
              
              <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white mb-2">Pro</h3>
                <p className="text-3xl font-bold text-blue-400 mb-4">$19<span className="text-lg font-normal text-slate-400">/month</span></p>
                <ul className="space-y-3 text-slate-300">
                  <li>• Unlimited MCQ tests</li>
                  <li>• Advanced voice interviews</li>
                  <li>• Unlimited resume reviews</li>
                  <li>• Detailed analytics</li>
                </ul>
              </div>
              
              <div className="rounded-xl border border-purple-500/30 bg-purple-950/30 p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white mb-2">Enterprise</h3>
                <p className="text-3xl font-bold text-purple-400 mb-4">Custom</p>
                <ul className="space-y-3 text-slate-300">
                  <li>• Everything in Pro</li>
                  <li>• Team collaboration</li>
                  <li>• Custom questions</li>
                  <li>• Priority support</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 p-8 lg:p-12">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white sm:text-4xl">
                  Ready to Ace Your Next Interview?
                </h2>
                <p className="mt-4 text-lg text-blue-100">
                  Join thousands of developers who've transformed their interview skills
                </p>
                <div className="mt-8">
                  <SignUpButton mode="modal">
                    <button className="group flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-blue-600 font-medium hover:bg-blue-50 transition-all duration-200 mx-auto">
                      Start Your Journey
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </SignUpButton>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800 px-6 py-12 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                  <BrainCircuit className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Interview Coach</h3>
                  <p className="text-xs text-slate-400">AI-Powered Practice</p>
                </div>
              </div>
              
              <div className="text-center text-sm text-slate-400">
                © 2026 Interview Coach. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
