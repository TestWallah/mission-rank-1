import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Calendar, CheckCircle, Trophy, Settings, Moon, Sun, Info, Menu, X, ArrowRight, Star, Target, Download, Share, RefreshCw } from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [darkMode, setDarkMode] = useState(true);
  const [completedTasks, setCompletedTasks] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [todayMatch, setTodayMatch] = useState(null);

  // --- Logic 1: Load Saved Progress & Setup Install ---
  useEffect(() => {
    // Progress Load
    const saved = localStorage.getItem('missionRank1Progress');
    if (saved) {
      setCompletedTasks(JSON.parse(saved));
    }

    // iOS Detection
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    // Install Prompt Listener
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // --- Logic 2: Automatic Date Detection ---
    const checkDate = () => {
      const now = new Date();
      // Format current date to match schedule format e.g., "16 Jan"
      const options = { day: '2-digit', month: 'short' };
      const todayStr = now.toLocaleDateString('en-GB', options); 
      // Note: 'en-GB' gives "16 Jan", some browsers might give "16 Jan." so we clean it
      const cleanDate = todayStr.replace('.', '');
      
      const match = scheduleData.find(d => d.date === cleanDate);
      
      if (match) {
        setTodayMatch(match);
      } else {
        // Fallback: If date not found (before start or after end)
        // Check if before start (Jan) or after
        // For simplicity, if not found, we default to the first incomplete day or Day 1
        // but for now let's just default to Day 1 or stick to last known
        setTodayMatch(scheduleData[0]); 
      }
    };
    
    checkDate();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // --- Install Handler ---
  const handleInstallClick = async () => {
    if (!installPrompt) {
        alert("Browser install support nahi kar raha. Menu se 'Add to Home Screen' karein!");
        return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  // --- Task Toggle Logic ---
  const toggleTask = (dayIndex, taskIndex) => {
    const key = `${dayIndex}-${taskIndex}`;
    const newCompleted = { ...completedTasks, [key]: !completedTasks[key] };
    setCompletedTasks(newCompleted);
    localStorage.setItem('missionRank1Progress', JSON.stringify(newCompleted));
    
    if (!completedTasks[key]) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  };

  const calculateProgress = () => {
    const totalTasks = scheduleData.reduce((acc, day) => acc + day.tasks.length, 0);
    const completedCount = Object.keys(completedTasks).filter(k => completedTasks[k]).length;
    return Math.round((completedCount / totalTasks) * 100) || 0;
  };

  const currentProgress = calculateProgress();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} font-sans overflow-hidden flex flex-col`}>
      
      {/* Header */}
      <header className={`p-4 shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'} z-10 flex justify-between items-center sticky top-0`}>
        <div className="flex items-center gap-2">
          <Trophy className="text-yellow-500 w-6 h-6 animate-pulse" />
          <h1 className="text-xl font-bold tracking-tight">Mission Rank 1 <span className="text-xs bg-yellow-500 text-black px-1 rounded ml-1">2026</span></h1>
        </div>
        
        <div className="flex items-center gap-3">
            {installPrompt && (
                <button 
                    onClick={handleInstallClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 font-bold animate-bounce"
                >
                    <Download size={14} /> Install
                </button>
            )}

            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-600'}`}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 p-4 scroll-smooth">
        
        {/* Progress Bar */}
        <div className={`mb-6 p-4 rounded-2xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-sm text-gray-400">Total Progress</p>
              <h2 className="text-3xl font-bold text-green-500">{currentProgress}%</h2>
            </div>
            <p className="text-xs text-gray-500">Rank 1 Loading...</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
            <div className="bg-green-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${currentProgress}%` }}></div>
          </div>
        </div>

        {activeTab === 'home' && <HomeView schedule={scheduleData} completedTasks={completedTasks} toggleTask={toggleTask} darkMode={darkMode} todayMatch={todayMatch} />}
        {activeTab === 'schedule' && <ScheduleView schedule={scheduleData} completedTasks={completedTasks} toggleTask={toggleTask} darkMode={darkMode} />}
        {activeTab === 'secrets' && <SecretsView darkMode={darkMode} />}
        {activeTab === 'settings' && (
            <SettingsView 
                setCompletedTasks={setCompletedTasks} 
                darkMode={darkMode} 
                installPrompt={installPrompt} 
                handleInstallClick={handleInstallClick}
                isIOS={isIOS}
            />
        )}

      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 w-full ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t pb-safe pt-2 px-4 shadow-lg z-20`}>
        <div className="flex justify-around items-center h-16">
          <NavItem icon={<Target />} label="Today" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavItem icon={<Calendar />} label="Schedule" active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} />
          <NavItem icon={<BookOpen />} label="Secrets" active={activeTab === 'secrets'} onClick={() => setActiveTab('secrets')} />
          <NavItem icon={<Settings />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </nav>

      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-6xl animate-bounce">🎉</div>
        </div>
      )}

    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${active ? 'text-blue-500 scale-110' : 'text-gray-400'}`}>
    <div className="mb-1">{React.cloneElement(icon, { size: 24 })}</div>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

// --- Views ---

const HomeView = ({ schedule, completedTasks, toggleTask, darkMode, todayMatch }) => {
  // Use the auto-detected date, or fallback to the first day
  const displayData = todayMatch || schedule[0];
  const dayIndex = schedule.indexOf(displayData);

  // Get current real date for display
  const realDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Date Card */}
      <div className={`p-5 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-blue-900 to-blue-700' : 'bg-gradient-to-br from-blue-500 to-blue-600'} text-white shadow-xl relative overflow-hidden`}>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
        
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-lg font-medium opacity-90">Today's Focus</h2>
                <h3 className="text-3xl font-bold mt-1">{displayData.date}</h3>
            </div>
            {/* Show 'Live' indicator if the displayed date matches real date */}
            {realDate.includes(displayData.date) && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
                    LIVE NOW
                </span>
            )}
        </div>
        
        <p className="mt-2 text-blue-100 flex items-center gap-2 text-sm"><Info size={16}/> {displayData.focus || "Bas Padhte Raho!"}</p>
      </div>

      {/* Tasks List */}
      <div>
        <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          <CheckCircle size={20} className="text-blue-500"/> Tasks for {displayData.date}
        </h3>
        
        {displayData.tasks.length > 0 ? (
            <div className="space-y-3">
            {displayData.tasks.map((task, idx) => (
                <TaskItem 
                key={idx} 
                task={task} 
                isChecked={!!completedTasks[`${dayIndex}-${idx}`]} 
                onToggle={() => toggleTask(dayIndex, idx)}
                darkMode={darkMode}
                subject={displayData.subjects[idx]}
                />
            ))}
            </div>
        ) : (
            <div className="p-4 text-center opacity-60">
                <p>Aaj ke liye koi tasks nahi hain! Maze karo 🎉</p>
            </div>
        )}
      </div>
      
      {/* Motivation Card */}
      <div className={`p-4 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-blue-50'} mt-6`}>
        <h4 className="font-bold text-sm mb-2 text-yellow-500">💡 Daily Motivation</h4>
        <p className="text-sm italic opacity-80">"Jo aaj padh raha hai, wahi kal raaj karega. Rukna mat!"</p>
      </div>
    </div>
  );
};

const ScheduleView = ({ schedule, completedTasks, toggleTask, darkMode }) => {
  // Scroll to current date on load logic could go here, but simple list is fine
  return (
    <div className="space-y-4 animate-fadeIn pb-20">
      <h2 className="text-2xl font-bold mb-4">Full Roadmap 🗺️</h2>
      {schedule.map((day, dIdx) => (
        <div key={dIdx} className={`rounded-xl overflow-hidden shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className={`p-3 border-b ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-100 bg-gray-50'} flex justify-between items-center`}>
            <div>
              <span className={`font-bold block text-lg ${day.date.includes("Sun") ? 'text-red-500' : 'text-blue-500'}`}>{day.date}</span>
              <span className="text-xs opacity-60">{day.focus}</span>
            </div>
            <div className="text-xs font-mono bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
              {day.tasks.filter((_, tIdx) => completedTasks[`${dIdx}-${tIdx}`]).length}/{day.tasks.length}
            </div>
          </div>
          <div className="p-3 space-y-2">
             {day.tasks.map((task, tIdx) => (
                <TaskItem 
                  key={tIdx} 
                  task={task} 
                  isChecked={!!completedTasks[`${dIdx}-${tIdx}`]} 
                  onToggle={() => toggleTask(dIdx, tIdx)}
                  darkMode={darkMode}
                  mini
                  subject={day.subjects[tIdx]}
                />
             ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const SecretsView = ({ darkMode }) => (
  <div className="space-y-6 animate-fadeIn pb-20">
    <div className="relative">
       <img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1000" alt="Study" className="w-full h-40 object-cover rounded-xl opacity-80" />
       <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent rounded-xl flex items-end p-4">
         <h2 className="text-2xl font-bold text-white">Topper's Secret Sauce 🤫</h2>
       </div>
    </div>

    <div className={`p-5 rounded-xl border-l-4 border-yellow-500 ${darkMode ? 'bg-gray-800' : 'bg-yellow-50'}`}>
      <h3 className="font-bold text-lg mb-2">🧠 Active Recall (R1 - R5)</h3>
      <ul className="space-y-2 text-sm opacity-90">
        <li><strong>R1 (Day 0):</strong> Chapter ko gehrai se padho. Notes banao.</li>
        <li><strong>R2 (24 hrs):</strong> Bina dekhe main points yaad karo.</li>
        <li><strong>R3 (Day 7):</strong> Weekly Test ya PYQ lagao.</li>
        <li><strong>R4 (Day 21):</strong> Random questions uthao.</li>
        <li><strong>R5 (Exam Day):</strong> Final Revision.</li>
      </ul>
    </div>

    <div className={`p-5 rounded-xl border-l-4 border-green-500 ${darkMode ? 'bg-gray-800' : 'bg-green-50'}`}>
      <h3 className="font-bold text-lg mb-2">📝 Presentation Hacks</h3>
      <ul className="space-y-2 text-sm opacity-90">
         <li className="flex gap-2">✨ <span>Answer ke baad <strong>2 lines</strong> chhodo.</span></li>
         <li className="flex gap-2">✨ <span>Keywords ko <strong>Black Pen</strong> se underline karo.</span></li>
         <li className="flex gap-2">✨ <span>Science mein <strong>Diagrams</strong> jaroor banao.</span></li>
      </ul>
    </div>

    <div className={`p-5 rounded-xl border-l-4 border-purple-500 ${darkMode ? 'bg-gray-800' : 'bg-purple-50'}`}>
      <h3 className="font-bold text-lg mb-2">⏰ 10 Hours Routine</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between border-b border-gray-500/20 pb-1"><span>07:00 - 10:00</span> <strong>Maths (Fresh Mind)</strong></div>
        <div className="flex justify-between border-b border-gray-500/20 pb-1"><span>11:30 - 01:30</span> <strong>Science (Concepts)</strong></div>
        <div className="flex justify-between border-b border-gray-500/20 pb-1"><span>03:00 - 05:00</span> <strong>SST (Story Mode)</strong></div>
        <div className="flex justify-between border-b border-gray-500/20 pb-1"><span>06:00 - 07:30</span> <strong>Hindi (Writing)</strong></div>
        <div className="flex justify-between border-b border-gray-500/20 pb-1"><span>09:00 - 10:30</span> <strong>Recall (Revision)</strong></div>
      </div>
    </div>
  </div>
);

const SettingsView = ({ setCompletedTasks, darkMode, installPrompt, handleInstallClick, isIOS }) => (
  <div className="animate-fadeIn space-y-6">
    <h2 className="text-2xl font-bold">Settings ⚙️</h2>
    
    <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <h3 className="font-bold mb-2">App Info</h3>
      <p className="text-sm opacity-70">Version: 2.1 (Auto-Date)</p>
      <p className="text-sm opacity-70">Target: UP Board 2026</p>
      
      {/* Install Instructions based on device */}
      <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
         <h4 className="font-bold text-blue-500 text-sm mb-1">📱 App Kaise Install Karein?</h4>
         {installPrompt ? (
            <button 
                onClick={handleInstallClick}
                className="mt-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
            >
                <Download size={18} /> Install Now
            </button>
         ) : isIOS ? (
            <p className="text-xs opacity-80">
               iPhone users: Niche <strong>Share</strong> button dabayein aur <strong>"Add to Home Screen"</strong> select karein.
            </p>
         ) : (
            <p className="text-xs opacity-80">
               Agar Install button nahi dikh raha, toh Chrome ke 3 dots (Menu) par click karein aur <strong>"Add to Home Screen"</strong> select karein.
            </p>
         )}
      </div>
    </div>

    <button 
      onClick={() => {
        if(window.confirm("Pakka? Saara progress udd jayega! 😲")) {
          setCompletedTasks({});
          localStorage.removeItem('missionRank1Progress');
        }
      }}
      className="w-full py-4 rounded-xl bg-red-500/10 text-red-500 font-bold border border-red-500/50 hover:bg-red-500 hover:text-white transition-colors"
    >
      Reset All Progress 🗑️
    </button>
  </div>
);

const TaskItem = ({ task, isChecked, onToggle, darkMode, mini, subject }) => (
  <div 
    onClick={onToggle}
    className={`
      flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all active:scale-95
      ${isChecked ? 'opacity-50' : 'opacity-100'}
      ${darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-white border border-gray-100 hover:shadow-md'}
    `}
  >
    <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-green-500 border-green-500' : 'border-gray-400'}`}>
      {isChecked && <CheckCircle size={14} className="text-white" />}
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-start">
        <p className={`${mini ? 'text-sm' : 'text-base'} font-medium ${isChecked ? 'line-through decoration-2 decoration-green-500/50' : ''}`}>
          {task}
        </p>
        {subject && !mini && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider
                ${subject === 'Maths' ? 'bg-blue-100 text-blue-700' : 
                  subject === 'Science' ? 'bg-green-100 text-green-700' :
                  subject === 'SST' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-700'}
            `}>
                {subject}
            </span>
        )}
      </div>
      {!mini && <p className="text-xs opacity-60 mt-1">Tap to complete</p>}
    </div>
  </div>
);

// --- Data ---
const scheduleData = [
  { 
    date: "16 Jan", 
    focus: "Phase 1: Strong Base Start", 
    subjects: ["Maths", "Science", "SST", "Hindi"],
    tasks: ["Real Numbers (वास्तविक संख्याएं)", "Chemical Reactions (रासायनिक अभिक्रियाएं)", "Europe Nationalism (यूरोप में राष्ट्रवाद)", "Mitrata (मित्रता) + Jeevan Parichay"]
  },
  { 
    date: "17 Jan", 
    focus: "Base Building", 
    subjects: ["Maths", "Science", "SST", "Hindi"],
    tasks: ["Polynomials (बहुपद)", "Acids, Bases & Salts (अम्ल, क्षार, लवण)", "Nationalism in India (भारत में राष्ट्रवाद)", "Mamta + Vyakaran"]
  },
  { 
    date: "18 Jan", 
    focus: "Linear Equations", 
    subjects: ["Maths", "Science", "SST", "Hindi"],
    tasks: ["Pair of Linear Eq (दो चर वाले रैखिक समीकरण)", "Metals & Non-metals (धातु और अधातु)", "Resources (संसाधन और विकास)", "Pad (Surdas) + Ras/Chand"]
  },
  { 
    date: "19 Jan", 
    focus: "Quadratic Equations", 
    subjects: ["Maths", "Science", "SST", "Hindi"],
    tasks: ["Quadratic Eq (द्विघात समीकरण)", "Carbon & Compounds Part 1", "Forest & Wildlife (वन और वन्य जीव)", "Dhanush Bhang (Tulsidas)"]
  },
  { 
    date: "20 Jan", 
    focus: "AP Series", 
    subjects: ["Maths", "Science", "SST", "Hindi"],
    tasks: ["Arithmetic Progression (समान्तर श्रेणियाँ)", "Carbon Part 2 + Periodic Classification", "Water Resources (जल संसाधन)", "Sanskriti (Gadya) + Vyakaran"]
  },
  { 
    date: "21 Jan", 
    focus: "Triangles Part 1", 
    subjects: ["Maths", "Science", "SST", "Hindi"],
    tasks: ["Triangles (Theorems)", "Life Process (Nutrition/Respiration)", "Agriculture (कृषि)", "Sanskrit: Varanasi"]
  },
  { 
    date: "22 Jan", 
    focus: "Triangles Part 2", 
    subjects: ["Maths", "Science", "SST", "Hindi"],
    tasks: ["Triangles (Questions)", "Life Process (Transportation/Excretion)", "Power Sharing (सत्ता की साझेदारी)", "Sanskrit: Veer Viren Pujyate"]
  },
  { 
    date: "23 Jan", 
    focus: "Phase 2: Acceleration", 
    subjects: ["Maths", "Science", "SST", "Hindi"],
    tasks: ["Coordinate Geometry (निर्देशांक ज्यामिति)", "Control & Coordination", "Federalism (संघवाद)", "Ajanata + Upsarg/Pratyay"]
  },
  { 
    date: "24 Jan", 
    focus: "Trigonometry Intro", 
    subjects: ["Maths", "Science", "SST", "Hindi"],
    tasks: ["Intro to Trigonometry", "How do Organisms Reproduce?", "Gender, Religion & Caste", "Bhakti/Neeti (Bihari)"]
  },
  { 
    date: "25 Jan", 
    focus: "Heights & Distance", 
    subjects: ["Maths", "Science", "SST", "Hindi"],
    tasks: ["Applications of Trigo (Heights & Dist)", "Heredity (आनुवंशिकता)", "Political Parties (राजनीतिक दल)", "Swadesh Prem (Ramnaresh)"]
  },
  { 
    date: "26 Jan", 
    focus: "Circles", 
    subjects: ["Maths", "Science", "SST", "Hindi"],
    tasks: ["Circles (वृत्त)", "Light: Reflection/Refraction Part 1", "Development (विकास)", "Sanskrit: Prabudho Gramin"]
  },
  { 
    date: "27 Jan", 
    focus: "Constructions", 
    subjects: ["Maths", "Science", "SST", "Hindi"],
    tasks: ["Constructions (रचनाएं)", "Light: Lens/Mirror Part 2", "Sectors of Indian Economy", "Karmveer Bharat (Khandkavya)"]
  },
  { 
    date: "28 Jan", 
    focus: "Surface Areas", 
    subjects: ["Maths", "Science", "SST", "Hindi"],
    tasks: ["Surface Areas & Volumes", "Human Eye (मानव नेत्र)", "Money & Credit (मुद्रा और साख)", "Vyakaran: Samas/Tatsam"]
  },
  { 
    date: "29 Jan", 
    focus: "Statistics", 
    subjects: ["Maths", "Science", "SST", "Hindi"],
    tasks: ["Statistics (सांख्यिकी)", "Electricity (विद्युत) Part 1", "Globalisation (वैश्वीकरण)", "Essay Writing (Nibandh)"]
  },
  { 
    date: "30 Jan", 
    focus: "Probability", 
    subjects: ["Maths", "Science", "SST", "Hindi"],
    tasks: ["Probability (प्रायिकता)", "Electricity Part 2", "Consumer Rights (उपभोक्ता अधिकार)", "Letter Writing (Patra Lekhan)"]
  },
  { 
    date: "31 Jan", 
    focus: "Phase 3: Sample Papers", 
    subjects: ["Maths", "Hindi", "Mock"],
    tasks: ["Maths Full Syllabus Revision", "Hindi Vyakaran Revision", "Maths Model Paper 1 (3 Hrs)"]
  },
  { 
    date: "01 Feb", 
    focus: "Science Focus", 
    subjects: ["Science", "SST", "Mock"],
    tasks: ["Science Full Syllabus Revision", "SST Maps Practice", "Science Model Paper 1 (3 Hrs)"]
  },
  { 
    date: "02 Feb", 
    focus: "SST Focus", 
    subjects: ["SST", "Maths", "Mock"],
    tasks: ["SST Full Syllabus Revision", "Maths Formula Revision", "SST Model Paper 1 (3 Hrs)"]
  },
  { 
    date: "03 Feb", 
    focus: "Weak Areas", 
    subjects: ["All"],
    tasks: ["Focus on Weak Topics", "Memorize Dates & Definitions"]
  },
  { 
    date: "04 Feb", 
    focus: "Hard Topics", 
    subjects: ["Maths", "Science"],
    tasks: ["Maths Hard Chapters", "Science Bio Diagrams", "R4 Cycle Revision"]
  },
  { 
    date: "05 Feb", 
    focus: "Physics & Grammar", 
    subjects: ["Science", "Hindi"],
    tasks: ["Physics Numericals", "Hindi Full Grammar", "Electricity/Light Numericals"]
  },
  { 
    date: "06 Feb", 
    focus: "History/Civics", 
    subjects: ["SST", "Maths"],
    tasks: ["History/Civics Timeline", "Maths Statistics Practice"]
  },
  { 
    date: "07 Feb", 
    focus: "Phase 4: Final Sim", 
    subjects: ["Maths", "Hindi"],
    tasks: ["Full Mock Test 1 (Maths)", "Full Mock Test 1 (Hindi)"]
  },
  { 
    date: "08 Feb", 
    focus: "Science/SST Sim", 
    subjects: ["Science", "SST"],
    tasks: ["Full Mock Test 2 (Science)", "Full Mock Test 2 (SST)"]
  },
  { 
    date: "09 Feb", 
    focus: "Analysis Day", 
    subjects: ["All"],
    tasks: ["Analyze Mock Tests", "Re-read weak topics"]
  },
  { 
    date: "10 Feb", 
    focus: "Maths Final Polish", 
    subjects: ["Maths"],
    tasks: ["NCERT Examples", "Theorems Revision"]
  },
  { 
    date: "11 Feb", 
    focus: "Science Final Polish", 
    subjects: ["Science"],
    tasks: ["All Formulas", "Chemical Equations", "Diagrams Practice"]
  },
  { 
    date: "12 Feb", 
    focus: "SST Final Polish", 
    subjects: ["SST"],
    tasks: ["Map Work", "Long Answer Keywords"]
  },
  { 
    date: "13 Feb", 
    focus: "Phase 5: Mission Hindi", 
    subjects: ["Hindi"],
    tasks: ["Hindi Gadya/Padya History", "Objective Questions"]
  },
  { 
    date: "14 Feb", 
    focus: "Hindi Bio", 
    subjects: ["Hindi"],
    tasks: ["Jeevan Parichay", "Khandkavya Memorization"]
  },
  { 
    date: "15 Feb", 
    focus: "Hindi Grammar", 
    subjects: ["Hindi"],
    tasks: ["Ras, Chand, Alankar", "Samas, Sandhi, Nibandh"]
  },
  { 
    date: "16 Feb", 
    focus: "Hindi Model Paper", 
    subjects: ["Hindi"],
    tasks: ["Solve 2025-26 Model Paper", "Time Management Check"]
  },
  { 
    date: "17 Feb", 
    focus: "Relax", 
    subjects: ["Relax"],
    tasks: ["Short Notes Review", "Sleep Early", "Ready for Victory 🏆"]
  }
];

export default App;


