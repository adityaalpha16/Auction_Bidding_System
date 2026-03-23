import React, { useEffect, useRef, useState } from 'react';
import logoUrl from '../assets/logo.png';
import bgUrl from '../assets/bg1.jpg';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const postJson = async (path, payload) => {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    throw new Error(`Cannot connect to backend at ${API_BASE_URL}. Start the backend server and try again.`);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
};

const getJson = async (path) => {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`);
  } catch (error) {
    throw new Error(`Cannot connect to backend at ${API_BASE_URL}. Start the backend server and try again.`);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
};

const putJson = async (path, payload) => {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    throw new Error(`Cannot connect to backend at ${API_BASE_URL}. Start the backend server and try again.`);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
};

const useScrollAnimation = (threshold = 0.1) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    const current = ref.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [threshold]);

  return [ref, isVisible];
};

const useParallax = () => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => setOffset(window.pageYOffset);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return offset;
};

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '20px 40px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 100,
        background: scrolled ? 'rgba(10, 14, 26, 0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        transition: 'all 0.3s ease'
      }}
    >
      <img
        src={logoUrl}
        alt="IPL Auction Logo"
        className="float-animation"
        style={{ width: '40px', height: '40px', objectFit: 'contain' }}
      />
      <span className="bebas" style={{ fontSize: '24px', color: '#00d4ff', letterSpacing: '2px' }}>
        IPL AUCTION
      </span>
    </header>
  );
};

const HeroSection = () => {
  const parallaxOffset = useParallax();

  return (
    <section
      style={{
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        overflow: 'hidden'
      }}
    >
      <div
        className="parallax-bg"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${bgUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          opacity: 0.6,
          zIndex: 1,
          transform: `translateY(${parallaxOffset * 0.3}px) scale(1.1)`
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(10,14,26,0.15) 0%, rgba(10,14,26,0.5) 50%, rgba(10,14,26,0.8) 100%)',
          zIndex: 2
        }}
      />
      <div style={{ position: 'relative', zIndex: 10, padding: '0 20px' }}>
        <h1
          className="bebas hero-title"
          style={{
            fontSize: 'clamp(48px, 10vw, 100px)',
            letterSpacing: '8px',
            marginBottom: '0',
            textShadow: '2px 2px 20px rgba(0,0,0,0.5)'
          }}
        >
          THE GRAND
        </h1>
        <h2
          className="bebas hero-title"
          style={{
            fontSize: 'clamp(60px, 14vw, 140px)',
            color: '#00d4ff',
            letterSpacing: '10px',
            marginTop: '-10px'
          }}
        >
          IPL AUCTION
        </h2>
        <p
          className="hero-description"
          style={{
            fontSize: 'clamp(14px, 2vw, 18px)',
            color: '#b0b0b0',
            maxWidth: '600px',
            margin: '20px auto 0',
            lineHeight: '1.6'
          }}
        >
          Experience the thrill of real-time IPL auction bidding. Build your dream team within ₹90 Crores budget.
        </p>
      </div>
      <StatsSection />
    </section>
  );
};

const StatsSection = () => {
  const stats = [
    { icon: '👥', value: '8', label: 'TEAMS' },
    { icon: '💵', value: '₹90Cr', label: 'BUDGET' },
    { icon: '🏆', value: '30+', label: 'PLAYERS' },
    { icon: '⚡️', value: 'Real-time', label: 'LIVE BIDDING', isItalic: true }
  ];

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 10,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '20px',
        maxWidth: '900px',
        width: '100%',
        padding: '60px 20px 40px',
        marginTop: '20px'
      }}
    >
      {stats.map((stat, index) => (
        <StatCard key={stat.label} {...stat} delay={index + 1} />
      ))}
    </div>
  );
};

const StatCard = ({ icon, value, label, isItalic, delay }) => {
  const [ref, isVisible] = useScrollAnimation(0.2);

  return (
    <div
      ref={ref}
      className={`animate-on-scroll scale-in delay-${delay} hover-lift ${isVisible ? 'visible' : ''}`}
      style={{
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(0, 212, 255, 0.3)',
        borderRadius: '12px',
        padding: '24px 16px',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
        cursor: 'default'
      }}
    >
      <div style={{ fontSize: '28px', marginBottom: '8px', color: '#00d4ff' }}>{icon}</div>
      <div className="bebas" style={{ fontSize: '32px', color: '#00d4ff', fontStyle: isItalic ? 'italic' : 'normal' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: '#8892a4', letterSpacing: '2px', marginTop: '4px' }}>{label}</div>
    </div>
  );
};

const HowItWorksSection = () => {
  const [titleRef, titleVisible] = useScrollAnimation(0.3);
  const steps = [
    { number: '01', title: 'Register Your Team', description: 'Create your franchise with a unique team name and get ready to build your squad.' },
    { number: '02', title: 'Live Bidding', description: 'Participate in real-time auctions and bid strategically to secure top players.' },
    { number: '03', title: 'Build Dream Team', description: 'Manage your ₹90Cr budget wisely and create the ultimate IPL winning combination.' }
  ];

  return (
    <section style={{ padding: '80px 20px', background: '#0a0e1a' }}>
      <h2
        ref={titleRef}
        className={`bebas animate-on-scroll fade-in-up ${titleVisible ? 'visible' : ''}`}
        style={{ fontSize: 'clamp(40px, 8vw, 72px)', textAlign: 'center', marginBottom: '60px', letterSpacing: '6px' }}
      >
        HOW IT <span style={{ color: '#00d4ff' }}>WORKS</span>
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '30px',
          maxWidth: '1100px',
          margin: '0 auto'
        }}
      >
        {steps.map((step, index) => (
          <StepCard key={step.number} {...step} index={index} />
        ))}
      </div>
    </section>
  );
};

const StepCard = ({ number, title, description, index }) => {
  const [ref, isVisible] = useScrollAnimation(0.2);
  const animationClass = index === 0 ? 'fade-in-left' : index === 2 ? 'fade-in-right' : 'fade-in-up';

  return (
    <div
      ref={ref}
      className={`animate-on-scroll ${animationClass} delay-${index + 1} hover-lift ${isVisible ? 'visible' : ''}`}
      style={{
        background: 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '16px',
        padding: '40px 30px',
        textAlign: 'center'
      }}
    >
      <div
        className="bebas"
        style={{
          fontSize: '72px',
          color: 'rgba(0, 150, 180, 0.4)',
          lineHeight: '1',
          marginBottom: '20px',
          transition: 'color 0.3s ease'
        }}
      >
        {number}
      </div>
      <h3 className="bebas" style={{ fontSize: '24px', letterSpacing: '2px', marginBottom: '16px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '14px', color: '#8892a4', lineHeight: '1.7' }}>{description}</p>
    </div>
  );
};

const CTASection = ({ onLoginSuccess }) => {
  const [titleRef, titleVisible] = useScrollAnimation(0.3);
  const [buttonsRef, buttonsVisible] = useScrollAnimation(0.2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [activeForm, setActiveForm] = useState(null);
  const [teamForm, setTeamForm] = useState({ managerName: '', teamName: '', email: '', password: '' });
  const [playerForm, setPlayerForm] = useState({ playerName: '', role: 'Batsman', email: '', password: '' });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(0, 212, 255, 0.35)',
    background: 'rgba(15, 23, 42, 0.8)',
    color: 'white',
    outline: 'none',
    fontSize: '14px'
  };

  const formLabelStyle = {
    display: 'block',
    textAlign: 'left',
    color: '#b0b0b0',
    marginBottom: '6px',
    fontSize: '13px'
  };

  const activateForm = (formType) => {
    setMessage('');
    setActiveForm(formType);
  };

  const submitTeamRegistration = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await postJson('/api/auth/register/team', teamForm);
      setMessage(`Team registration successful: ${data.user.teamName}`);
      setTeamForm({ managerName: '', teamName: '', email: '', password: '' });
    } catch (error) {
      setMessage(`Team registration failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitPlayerRegistration = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await postJson('/api/auth/register/player', playerForm);
      setMessage(`Player registration successful: ${data.user.playerName}`);
      setPlayerForm({ playerName: '', role: 'Batsman', email: '', password: '' });
    } catch (error) {
      setMessage(`Player registration failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await postJson('/api/auth/login', loginForm);
      setMessage(`Login successful: ${data.user.email}`);
      setLoginForm({ email: '', password: '' });
      if (typeof onLoginSuccess === 'function') onLoginSuccess(data.user);
    } catch (error) {
      setMessage(`Login failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section style={{ padding: '100px 20px', background: '#0a0e1a', textAlign: 'center' }}>
      <h2
        ref={titleRef}
        className={`bebas animate-on-scroll fade-in-up ${titleVisible ? 'visible' : ''}`}
        style={{ fontSize: 'clamp(40px, 8vw, 72px)', marginBottom: '20px', letterSpacing: '4px' }}
      >
        READY TO <span style={{ color: '#00d4ff' }}>DOMINATE</span>?
      </h2>
      <p
        className={`animate-on-scroll fade-in-up delay-2 ${titleVisible ? 'visible' : ''}`}
        style={{ fontSize: '16px', color: '#8892a4', marginBottom: '50px', maxWidth: '500px', margin: '0 auto 50px' }}
      >
        Join thousands of cricket enthusiasts in the most exciting auction experience.
      </p>
      <div ref={buttonsRef} style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
        <CTAButton text="REGISTER AS TEAM" variant="primary" isVisible={buttonsVisible} delay={1} onClick={() => activateForm('team')} isLoading={isSubmitting} />
        <CTAButton text="REGISTER AS PLAYER" variant="secondary" isVisible={buttonsVisible} delay={2} onClick={() => activateForm('player')} isLoading={isSubmitting} />
        <CTAButton text="ALREADY HAVE ACCOUNT? LOGIN" variant="outline" isVisible={buttonsVisible} delay={3} onClick={() => activateForm('login')} isLoading={isSubmitting} />
        <a
          href="/team-auction"
          className={`animate-on-scroll scale-in delay-4 ${buttonsVisible ? 'visible' : ''}`}
          style={{
            padding: '18px 32px',
            fontSize: '14px',
            fontWeight: '600',
            letterSpacing: '1px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily: "'Bebas Neue', sans-serif",
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            background: '#0066ff',
            color: 'white',
            border: 'none',
            boxShadow: '0 5px 15px rgba(0, 102, 255, 0.2)',
            textDecoration: 'none'
          }}
        >
          GO <span style={{ fontSize: '18px', transition: 'transform 0.3s ease' }}>→</span>
        </a>
      </div>

      {activeForm === 'team' && (
        <form
          onSubmit={submitTeamRegistration}
          style={{
            maxWidth: '560px',
            margin: '28px auto 0',
            display: 'grid',
            gap: '14px',
            padding: '22px',
            borderRadius: '14px',
            border: '1px solid rgba(0, 212, 255, 0.28)',
            background: 'rgba(10, 14, 26, 0.85)'
          }}
        >
          <h3 className="bebas" style={{ letterSpacing: '1px', fontSize: '24px', textAlign: 'left' }}>Team Registration</h3>
          <div>
            <label style={formLabelStyle}>Manager Name</label>
            <input required value={teamForm.managerName} onChange={(event) => setTeamForm({ ...teamForm, managerName: event.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={formLabelStyle}>Team Name</label>
            <input required value={teamForm.teamName} onChange={(event) => setTeamForm({ ...teamForm, teamName: event.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={formLabelStyle}>Email</label>
            <input required type="email" value={teamForm.email} onChange={(event) => setTeamForm({ ...teamForm, email: event.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={formLabelStyle}>Password</label>
            <input required type="password" value={teamForm.password} onChange={(event) => setTeamForm({ ...teamForm, password: event.target.value })} style={inputStyle} />
          </div>
          <button type="submit" style={{ ...inputStyle, background: '#0066ff', border: 'none', cursor: 'pointer' }} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Team Registration'}
          </button>
        </form>
      )}

      {activeForm === 'player' && (
        <form
          onSubmit={submitPlayerRegistration}
          style={{
            maxWidth: '560px',
            margin: '28px auto 0',
            display: 'grid',
            gap: '14px',
            padding: '22px',
            borderRadius: '14px',
            border: '1px solid rgba(0, 212, 255, 0.28)',
            background: 'rgba(10, 14, 26, 0.85)'
          }}
        >
          <h3 className="bebas" style={{ letterSpacing: '1px', fontSize: '24px', textAlign: 'left' }}>Player Registration</h3>
          <div>
            <label style={formLabelStyle}>Player Name</label>
            <input required value={playerForm.playerName} onChange={(event) => setPlayerForm({ ...playerForm, playerName: event.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={formLabelStyle}>Role</label>
            <select value={playerForm.role} onChange={(event) => setPlayerForm({ ...playerForm, role: event.target.value })} style={inputStyle}>
              <option value="Batsman">Batsman</option>
              <option value="Bowler">Bowler</option>
              <option value="All-Rounder">All-Rounder</option>
              <option value="Wicket-Keeper">Wicket-Keeper</option>
            </select>
          </div>
          <div>
            <label style={formLabelStyle}>Email</label>
            <input required type="email" value={playerForm.email} onChange={(event) => setPlayerForm({ ...playerForm, email: event.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={formLabelStyle}>Password</label>
            <input required type="password" value={playerForm.password} onChange={(event) => setPlayerForm({ ...playerForm, password: event.target.value })} style={inputStyle} />
          </div>
          <button type="submit" style={{ ...inputStyle, background: '#00d4ff', color: '#0a0e1a', border: 'none', cursor: 'pointer' }} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Player Registration'}
          </button>
        </form>
      )}

      {activeForm === 'login' && (
        <form
          onSubmit={submitLogin}
          style={{
            maxWidth: '560px',
            margin: '28px auto 0',
            display: 'grid',
            gap: '14px',
            padding: '22px',
            borderRadius: '14px',
            border: '1px solid rgba(0, 212, 255, 0.28)',
            background: 'rgba(10, 14, 26, 0.85)'
          }}
        >
          <h3 className="bebas" style={{ letterSpacing: '1px', fontSize: '24px', textAlign: 'left' }}>Login</h3>
          <div>
            <label style={formLabelStyle}>Email</label>
            <input required type="email" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={formLabelStyle}>Password</label>
            <input required type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} style={inputStyle} />
          </div>
          <button type="submit" style={{ ...inputStyle, background: 'transparent', color: '#00d4ff', border: '2px solid #00d4ff', cursor: 'pointer' }} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Login'}
          </button>
        </form>
      )}

      <p style={{ marginTop: '20px', color: '#b0b0b0', minHeight: '24px' }}>{message}</p>
    </section>
  );
};

const TeamAuctionPage = ({ onBack, loggedInUser }) => {
  const [currentUser, setCurrentUser] = useState(loggedInUser || null);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [isRoundRunning, setIsRoundRunning] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ managerName: '', teamName: '', purse: '' });

  const normalizeTeamName = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const loginTeamName = String(currentUser?.teamName || '').trim();
  const normalizedLoginTeamName = normalizeTeamName(loginTeamName);
  const loggedInTeam = normalizedLoginTeamName
    ? teams.find((team) => {
        const normalizedTeam = normalizeTeamName(team.name);
        return (
          normalizedTeam === normalizedLoginTeamName
          || normalizedTeam.includes(normalizedLoginTeamName)
          || normalizedLoginTeamName.includes(normalizedTeam)
        );
      })
    : null;
  const isTeamSelectionLocked = currentUser?.role === 'team' && !!loggedInTeam;

  useEffect(() => {
    setCurrentUser(loggedInUser || null);
  }, [loggedInUser]);

  const findNextUnsoldIndex = (playerList, fromIndex = 0) => {
    if (!playerList.length) return 0;
    const safeStart = Math.max(0, fromIndex);

    for (let index = safeStart; index < playerList.length; index += 1) {
      if (!playerList[index].sold) return index;
    }

    for (let index = 0; index < safeStart; index += 1) {
      if (!playerList[index].sold) return index;
    }

    return Math.min(safeStart, playerList.length - 1);
  };

  const refreshData = async () => {
    const [playersData, teamsData] = await Promise.all([getJson('/api/players'), getJson('/api/teams')]);
    const nextPlayers = playersData.players || [];
    const nextTeams = teamsData.teams || [];
    setPlayers(nextPlayers);
    setTeams(nextTeams);
    return { nextPlayers, nextTeams };
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const { nextPlayers } = await refreshData();
        setCurrentPlayerIndex(findNextUnsoldIndex(nextPlayers, 0));
      } catch (loadError) {
        setError(loadError.message);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (teams.length === 0) return;

    if (loggedInTeam) {
      setSelectedTeamId(loggedInTeam.id);
      return;
    }

    if (!selectedTeamId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId, loggedInTeam]);

  useEffect(() => {
    if (!isRoundRunning) return undefined;

    const timer = window.setInterval(() => {
      setTimeLeft((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRoundRunning]);

  const currentPlayer = players[currentPlayerIndex] || null;
  const currentBidEntries = [...(currentPlayer?.bids || [])].sort((left, right) => right.amount - left.amount);
  const minimumBid = Math.max(currentPlayer?.basePrice || 0, currentPlayer?.highestBid || 0) + 1;

  const startRound = () => {
    if (!currentPlayer || currentPlayer.sold) return;
    setLastResult(null);
    setTimeLeft(25);
    setIsRoundRunning(true);
  };

  const pauseRound = () => {
    setIsRoundRunning(false);
  };

  const moveToNextPlayer = () => {
    setIsRoundRunning(false);
    setTimeLeft(25);
    setLastResult(null);
    setBidAmount('');
    setCurrentPlayerIndex((previous) => findNextUnsoldIndex(players, previous + 1));
  };

  const resolveCurrentPlayer = async () => {
    if (!currentPlayer) return;

    const playerName = currentPlayer.name;
    const playerId = currentPlayer.id;

    try {
      const response = await postJson(`/api/resolve/${playerId}`, {});
      const { nextPlayers, nextTeams } = await refreshData();
      const winnerTeam = nextTeams.find((team) => team.id === response?.winner?.teamId);

      if (response?.ok && response?.winner) {
        setLastResult({
          message: `${playerName} sold to ${winnerTeam?.name || response.winner.teamId} for ₹${response.winner.amount}`,
          sold: true
        });
      } else {
        setLastResult({
          message: `${playerName} received no valid bid.`,
          sold: false
        });
      }

      const resolvedIndex = nextPlayers.findIndex((player) => player.id === playerId);
      setCurrentPlayerIndex(findNextUnsoldIndex(nextPlayers, resolvedIndex + 1));
    } catch (resolveError) {
      setError(resolveError.message);
    } finally {
      setIsRoundRunning(false);
      setTimeLeft(25);
      setBidAmount('');
    }
  };

  useEffect(() => {
    if (timeLeft === 0 && isRoundRunning) {
      resolveCurrentPlayer();
    }
  }, [timeLeft, isRoundRunning]);

  const submitBid = async () => {
    if (!currentPlayer || !selectedTeamId || !isRoundRunning) return;

    const parsedAmount = Number(bidAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < minimumBid) {
      setError(`Bid must be at least ₹${minimumBid}.`);
      return;
    }

    const selectedTeam = teams.find((team) => team.id === selectedTeamId);
    const remainingPurse = (selectedTeam?.purse || 0) - (selectedTeam?.spent || 0);
    if (parsedAmount > remainingPurse) {
      setError(`${selectedTeam?.name || 'Selected team'} does not have enough purse. Remaining: ₹${remainingPurse}`);
      return;
    }

    setIsSubmittingBid(true);
    setError('');

    try {
      await postJson('/api/bid', {
        playerId: currentPlayer.id,
        teamId: selectedTeamId,
        amount: parsedAmount
      });

      const { nextPlayers } = await refreshData();
      const updatedIndex = nextPlayers.findIndex((player) => player.id === currentPlayer.id);
      if (updatedIndex >= 0) {
        setCurrentPlayerIndex(updatedIndex);
      }
      setBidAmount('');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const openSettings = async () => {
    if (!currentUser?.id || currentUser?.role !== 'team') {
      setError('Please login as a team to edit settings.');
      return;
    }

    try {
      const response = await getJson(`/api/team/settings/${currentUser.id}`);
      const nextSettings = response?.settings || {};
      setSettingsForm({
        managerName: nextSettings.managerName || '',
        teamName: nextSettings.teamName || currentUser.teamName || '',
        purse: String(nextSettings.purse ?? '')
      });
      setIsSettingsOpen(true);
    } catch (settingsError) {
      setError(settingsError.message);
    }
  };

  const saveSettings = async () => {
    if (!currentUser?.id) return;

    const nextManagerName = String(settingsForm.managerName || '').trim();
    const nextTeamName = String(settingsForm.teamName || '').trim();
    const nextPurse = Number(settingsForm.purse);

    if (!nextManagerName || !nextTeamName || !Number.isFinite(nextPurse) || nextPurse < 0) {
      setError('Please fill valid manager name, team name and purse amount.');
      return;
    }

    setIsSavingSettings(true);
    setError('');

    try {
      const response = await putJson(`/api/team/settings/${currentUser.id}`, {
        managerName: nextManagerName,
        teamName: nextTeamName,
        purse: nextPurse
      });

      if (response?.user) {
        setCurrentUser(response.user);
      }

      await refreshData();
      setIsSettingsOpen(false);
    } catch (settingsError) {
      setError(settingsError.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', color: 'white', padding: '100px 24px 40px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 className="bebas" style={{ fontSize: 'clamp(32px, 6vw, 60px)', letterSpacing: '3px' }}>
            TEAM AUCTION DASHBOARD
          </h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={openSettings}
              style={{
                padding: '10px 16px',
                border: '1px solid #00d4ff',
                color: '#00d4ff',
                background: 'transparent',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Settings
            </button>
            <button
              onClick={onBack}
              style={{
                padding: '10px 16px',
                border: '1px solid #00d4ff',
                color: '#00d4ff',
                background: 'transparent',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Back
            </button>
          </div>
        </div>

        {error && <p style={{ color: '#ff8f8f', marginBottom: '16px' }}>{error}</p>}

        <div style={{ border: '1px solid rgba(0,212,255,0.28)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
          <div className="bebas" style={{ fontSize: '26px', color: '#00d4ff', letterSpacing: '1px', marginBottom: '10px' }}>
            LIVE BID ROUND (25s)
          </div>

          {currentPlayer ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700 }}>{currentPlayer.name}</div>
                  <div style={{ color: '#b0b0b0', fontSize: '14px' }}>{currentPlayer.category}</div>
                  <div style={{ color: '#00d4ff', marginTop: '6px' }}>Current Highest: ₹{currentPlayer.highestBid}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="bebas" style={{ fontSize: '44px', color: timeLeft <= 5 ? '#ff8f8f' : '#00d4ff' }}>
                    {timeLeft}s
                  </div>
                  <div style={{ color: '#b0b0b0', fontSize: '13px' }}>{isRoundRunning ? 'Round running' : 'Round paused'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <button onClick={startRound} style={{ padding: '10px 14px', border: 'none', borderRadius: '8px', background: '#0066ff', color: 'white', cursor: 'pointer' }}>
                  Start Bid
                </button>
                <button onClick={pauseRound} style={{ padding: '10px 14px', border: '1px solid #00d4ff', borderRadius: '8px', background: 'transparent', color: '#00d4ff', cursor: 'pointer' }}>
                  Pause
                </button>
                <button onClick={moveToNextPlayer} style={{ padding: '10px 14px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', background: 'transparent', color: 'white', cursor: 'pointer' }}>
                  Next Player
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr auto', gap: '10px', alignItems: 'center' }}>
                <select
                  value={selectedTeamId}
                  onChange={(event) => setSelectedTeamId(event.target.value)}
                  disabled={isTeamSelectionLocked}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(0, 212, 255, 0.35)', background: 'rgba(10, 14, 26, 0.85)', color: 'white' }}
                >
                  {(isTeamSelectionLocked ? [loggedInTeam] : teams).filter(Boolean).map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} (Remaining ₹{team.purse - (team.spent || 0)})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={minimumBid}
                  value={bidAmount}
                  onChange={(event) => setBidAmount(event.target.value)}
                  placeholder={`Min ₹${minimumBid}`}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(0, 212, 255, 0.35)', background: 'rgba(10, 14, 26, 0.85)', color: 'white' }}
                />
                <div style={{ color: '#b0b0b0', fontSize: '13px' }}>
                  {isTeamSelectionLocked
                    ? `Logged in team: ${loggedInTeam.name}`
                    : isRoundRunning
                      ? 'Bidding open'
                      : 'Start round to bid'}
                </div>
                <button
                  onClick={submitBid}
                  disabled={!isRoundRunning || isSubmittingBid}
                  style={{
                    padding: '10px 14px',
                    border: 'none',
                    borderRadius: '8px',
                    background: !isRoundRunning || isSubmittingBid ? 'rgba(0, 212, 255, 0.25)' : '#00d4ff',
                    color: '#0a0e1a',
                    cursor: !isRoundRunning || isSubmittingBid ? 'not-allowed' : 'pointer',
                    fontWeight: 600
                  }}
                >
                  {isSubmittingBid ? 'Submitting...' : 'Place Bid'}
                </button>
              </div>

              <div style={{ marginTop: '14px' }}>
                <div style={{ color: '#b0b0b0', marginBottom: '6px', fontSize: '13px' }}>Live bids</div>
                {currentBidEntries.length === 0 ? (
                  <div style={{ color: '#6b7280', fontSize: '13px' }}>No bids yet.</div>
                ) : (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {currentBidEntries.map((bid) => {
                      const teamName = teams.find((team) => team.id === bid.teamId)?.name || bid.teamId;
                      return (
                        <div key={bid.teamId} style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px' }}>
                          <span>{teamName}</span>
                          <span style={{ color: '#00d4ff' }}>₹{bid.amount}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p style={{ color: '#b0b0b0' }}>No players available for bidding.</p>
          )}
        </div>

        {lastResult && (
          <div
            style={{
              marginBottom: '20px',
              borderRadius: '10px',
              padding: '12px 14px',
              border: `1px solid ${lastResult.sold ? 'rgba(0, 212, 255, 0.45)' : 'rgba(255,255,255,0.2)'}`,
              background: lastResult.sold ? 'rgba(0, 212, 255, 0.08)' : 'rgba(255,255,255,0.05)'
            }}
          >
            {lastResult.message}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {teams.map((team) => (
            <div key={team.id} style={{ border: '1px solid rgba(0,212,255,0.28)', borderRadius: '12px', padding: '14px' }}>
              <div className="bebas" style={{ fontSize: '24px', color: '#00d4ff', letterSpacing: '1px' }}>
                {team.name}
              </div>
              <div style={{ color: '#b0b0b0', marginTop: '6px', fontSize: '14px' }}>Purse: ₹{team.purse}</div>
              <div style={{ color: '#b0b0b0', marginTop: '4px', fontSize: '14px' }}>Spent: ₹{team.spent || 0}</div>
            </div>
          ))}
        </div>

        <div style={{ border: '1px solid rgba(0,212,255,0.28)', borderRadius: '12px', overflow: 'hidden' }}>
          <div className="bebas" style={{ padding: '14px', fontSize: '24px', letterSpacing: '1px', background: 'rgba(0,212,255,0.08)' }}>
            Players
          </div>
          <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
            {players.map((player) => (
              <div
                key={player.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  gap: '12px',
                  padding: '12px 14px',
                  borderTop: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <div>{player.name}</div>
                <div style={{ color: '#b0b0b0' }}>{player.category}</div>
                <div style={{ color: '#00d4ff' }}>₹{player.highestBid}</div>
                <div style={{ color: player.sold ? '#7de89b' : '#b0b0b0' }}>{player.sold ? `Sold (${player.team || '-'})` : 'Unsold'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ width: '100%', maxWidth: '520px', background: '#0f172a', border: '1px solid rgba(0, 212, 255, 0.35)', borderRadius: '12px', padding: '20px' }}>
            <div className="bebas" style={{ fontSize: '28px', color: '#00d4ff', letterSpacing: '1px', marginBottom: '14px' }}>
              Team Settings
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#b0b0b0', marginBottom: '6px', fontSize: '13px' }}>Manager Name</label>
                <input
                  value={settingsForm.managerName}
                  onChange={(event) => setSettingsForm((prev) => ({ ...prev, managerName: event.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0, 212, 255, 0.35)', background: 'rgba(10, 14, 26, 0.85)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#b0b0b0', marginBottom: '6px', fontSize: '13px' }}>Team Name</label>
                <input
                  value={settingsForm.teamName}
                  onChange={(event) => setSettingsForm((prev) => ({ ...prev, teamName: event.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0, 212, 255, 0.35)', background: 'rgba(10, 14, 26, 0.85)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#b0b0b0', marginBottom: '6px', fontSize: '13px' }}>Purse Amount</label>
                <input
                  type="number"
                  min="0"
                  value={settingsForm.purse}
                  onChange={(event) => setSettingsForm((prev) => ({ ...prev, purse: event.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0, 212, 255, 0.35)', background: 'rgba(10, 14, 26, 0.85)', color: 'white' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
              <button
                onClick={() => setIsSettingsOpen(false)}
                style={{ padding: '10px 14px', border: '1px solid rgba(255,255,255,0.35)', borderRadius: '8px', background: 'transparent', color: 'white', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                disabled={isSavingSettings}
                style={{ padding: '10px 14px', border: 'none', borderRadius: '8px', background: '#00d4ff', color: '#0a0e1a', cursor: isSavingSettings ? 'not-allowed' : 'pointer', fontWeight: 600 }}
              >
                {isSavingSettings ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CTAButton = ({ text, variant, isVisible, delay, onClick, isLoading }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getStyles = () => {
    const base = {
      padding: '18px 32px',
      fontSize: '14px',
      fontWeight: '600',
      letterSpacing: '1px',
      borderRadius: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontFamily: "'Bebas Neue', sans-serif",
      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      transform: isHovered ? 'translateY(-4px) scale(1.05)' : 'translateY(0) scale(1)'
    };

    switch (variant) {
      case 'primary':
        return {
          ...base,
          background: isHovered ? '#0052cc' : '#0066ff',
          color: 'white',
          border: 'none',
          boxShadow: isHovered ? '0 15px 30px rgba(0, 102, 255, 0.4)' : '0 5px 15px rgba(0, 102, 255, 0.2)'
        };
      case 'secondary':
        return {
          ...base,
          background: isHovered ? '#00b8d9' : '#00d4ff',
          color: '#0a0e1a',
          border: 'none',
          boxShadow: isHovered ? '0 15px 30px rgba(0, 212, 255, 0.4)' : '0 5px 15px rgba(0, 212, 255, 0.2)'
        };
      case 'outline':
        return {
          ...base,
          background: isHovered ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
          color: '#00d4ff',
          border: '2px solid #00d4ff',
          boxShadow: isHovered ? '0 15px 30px rgba(0, 212, 255, 0.2)' : 'none'
        };
      default:
        return base;
    }
  };

  return (
    <button
      className={`animate-on-scroll scale-in delay-${delay} shimmer-btn ${isVisible ? 'visible' : ''}`}
      style={getStyles()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      disabled={isLoading}
    >
      {text}
      <span
        style={{
          fontSize: '18px',
          transition: 'transform 0.3s ease',
          transform: isHovered ? 'translateX(5px)' : 'translateX(0)'
        }}
      >
        →
      </span>
    </button>
  );
};

const Footer = () => {
  const [ref, isVisible] = useScrollAnimation(0.3);

  return (
    <footer
      ref={ref}
      className={`animate-on-scroll fade-in-up ${isVisible ? 'visible' : ''}`}
      style={{
        padding: '40px 20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        background: 'rgba(5, 8, 15, 0.8)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
        <img
          src={logoUrl}
          alt="IPL Auction Logo"
          className="float-animation"
          style={{ width: '32px', height: '32px', objectFit: 'contain' }}
        />
        <span className="bebas" style={{ fontSize: '20px', letterSpacing: '2px' }}>
          IPL AUCTION 2026
        </span>
      </div>
      <p style={{ fontSize: '14px', color: '#6b7280' }}>© 2026 IPL Auction. All rights reserved.</p>
    </footer>
  );
};

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname || '/');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
    }
  };

  if (currentPath === '/team-auction') {
    return <TeamAuctionPage onBack={() => navigate('/')} loggedInUser={loggedInUser} />;
  }

  return (
    <div>
      <Header />
      <HeroSection />
      <HowItWorksSection />
      <CTASection
        onLoginSuccess={(user) => {
          setLoggedInUser(user || null);
          navigate('/team-auction');
        }}
      />
      <Footer />
    </div>
  );
}