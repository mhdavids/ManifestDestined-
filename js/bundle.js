/**
 * bundle.js - All game code bundled for direct browser use
 * Manifest Destined for Greatness - MBA AP US History Adventure
 */

(function() {
    'use strict';

    // ============================================
    // PARTICLES MODULE
    // ============================================
    const Particles = (function() {
        let canvas = null;
        let ctx = null;
        let particles = [];
        let animationId = null;
        let isRunning = false;

        const colors = {
            correct: ['#4a7c9b', '#6a9bbf', '#c9a84c', '#f4e4bc'],
            incorrect: ['#9b4a4a', '#bf6a6a'],
            mastery: ['#c9a84c', '#f4e4bc', '#4a7c9b', '#6ba4c9'],
            rune: ['#c9a84c', '#f4e4bc', '#ffffff', '#ffdd77']
        };

        function init() {
            canvas = document.getElementById('particle-canvas');
            if (!canvas) return;
            ctx = canvas.getContext('2d');
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
        }

        function resizeCanvas() {
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        function createParticle(x, y, type, config) {
            config = config || {};
            const colorSet = colors[type] || colors.correct;
            const color = colorSet[Math.floor(Math.random() * colorSet.length)];
            return {
                x: x, y: y,
                vx: config.vx !== undefined ? config.vx : (Math.random() - 0.5) * 8,
                vy: config.vy !== undefined ? config.vy : (Math.random() - 0.5) * 8 - 2,
                life: 1,
                decay: config.decay || 0.02 + Math.random() * 0.02,
                color: color,
                size: config.size || 3 + Math.random() * 4,
                type: config.shape || 'circle',
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            };
        }

        function burst(x, y, type, count) {
            count = count || 20;
            for (let i = 0; i < count; i++) particles.push(createParticle(x, y, type));
            startAnimation();
        }

        function sparkle(x, y, type, count) {
            count = count || 15;
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
                const speed = 2 + Math.random() * 3;
                particles.push(createParticle(x, y, type, {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 1,
                    size: 2 + Math.random() * 3,
                    decay: 0.015 + Math.random() * 0.01
                }));
            }
            startAnimation();
        }

        function spiral(x, y, type, duration) {
            duration = duration || 2000;
            const startTime = Date.now();
            const interval = setInterval(function() {
                const elapsed = Date.now() - startTime;
                if (elapsed > duration) { clearInterval(interval); return; }
                const progress = elapsed / duration;
                const angle = progress * Math.PI * 8;
                const radius = 50 + progress * 100;
                const px = x + Math.cos(angle) * radius * (1 - progress);
                const py = y + Math.sin(angle) * radius * (1 - progress);
                for (let i = 0; i < 3; i++) {
                    particles.push(createParticle(px, py, type, {
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        size: 2 + Math.random() * 4,
                        decay: 0.03 + Math.random() * 0.02
                    }));
                }
            }, 30);
            startAnimation();
        }

        function fadeParticles(x, y, type, count) {
            count = count || 10;
            for (let i = 0; i < count; i++) {
                particles.push(createParticle(x, y, type, {
                    vx: (Math.random() - 0.5) * 3,
                    vy: -1 - Math.random() * 2,
                    size: 4 + Math.random() * 6,
                    decay: 0.01 + Math.random() * 0.01
                }));
            }
            startAnimation();
        }

        function celebrationBurst(x, y) {
            for (let wave = 0; wave < 3; wave++) {
                setTimeout(function() {
                    burst(x, y, 'mastery', 25);
                    sparkle(x, y, 'mastery', 20);
                }, wave * 150);
            }
        }

        function update() {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx; p.y += p.vy;
                p.vy += 0.1;
                p.life -= p.decay;
                p.rotation += p.rotationSpeed;
                if (p.life <= 0) { particles.splice(i, 1); continue; }
                ctx.save();
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            if (particles.length === 0) { stopAnimation(); return; }
            animationId = requestAnimationFrame(update);
        }

        function startAnimation() {
            if (!isRunning) {
                isRunning = true;
                animationId = requestAnimationFrame(update);
            }
        }

        function stopAnimation() {
            isRunning = false;
            if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
        }

        function clear() {
            particles = [];
            if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
            stopAnimation();
        }

        return { init, burst, sparkle, spiral, fadeParticles, celebrationBurst, clear };
    })();

    // ============================================
    // GAME STATE MODULE
    // ============================================
    const Game = (function() {
        const STORAGE_KEY = 'manifest_destined_save';
        const MASTERY_THRESHOLD = 5;
        let gameState = null;

        function createNewGameState() {
            return {
                version: 1,
                created: Date.now(),
                lastPlayed: Date.now(),
                currentRegion: null,
                currentTopic: null,
                runes: {
                    'the-shore': false, 'the-colony': false, 'the-tavern': false,
                    'the-frontier': false, 'the-divided-house': false, 'the-factory': false,
                    'the-home-front': false, 'the-march': false, 'the-mall': false
                },
                topics: {},
                stats: {
                    totalProblemsAttempted: 0, totalProblemsCorrect: 0,
                    totalTopicsMastered: 0, totalPoints: 0, playTime: 0
                },
                hasSeenIntro: false,
                gameCompleted: false
            };
        }

        function loadFromStorage() {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) return JSON.parse(saved);
            } catch(e) { console.error('Failed to load game:', e); }
            return null;
        }

        function saveToStorage() {
            try {
                gameState.lastPlayed = Date.now();
                localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
                if (Auth.isSignedIn()) CloudSave.saveProgress(Auth.getUserId(), gameState);
                return true;
            } catch(e) { console.error('Failed to save game:', e); return false; }
        }

        function loadFromCloud() {
            if (!Auth.isSignedIn()) return Promise.resolve(null);
            return CloudSave.loadProgress(Auth.getUserId()).then(function(cloudState) {
                if (cloudState) {
                    const localState = loadFromStorage();
                    if (!localState || cloudState.lastPlayed > localState.lastPlayed) {
                        gameState = cloudState;
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
                    } else {
                        CloudSave.saveProgress(Auth.getUserId(), localState);
                    }
                    return gameState;
                }
                return null;
            });
        }

        function syncWithCloud() { return loadFromCloud(); }

        function initGame() {
            const saved = loadFromStorage();
            if (saved) { gameState = saved; gameState.lastPlayed = Date.now(); }
            else gameState = createNewGameState();
            return gameState;
        }

        function newGame() { gameState = createNewGameState(); saveToStorage(); return gameState; }
        function getState() { return gameState; }
        function hasSavedGame() {
            try { return localStorage.getItem(STORAGE_KEY) !== null; } catch(e) { return false; }
        }
        function clearSave() {
            try { localStorage.removeItem(STORAGE_KEY); return true; } catch(e) { return false; }
        }

        function getTopicProgress(topicId) {
            if (!gameState.topics[topicId]) {
                gameState.topics[topicId] = { mastered: false, streak: 0, attempts: 0, correctAnswers: 0 };
            }
            return gameState.topics[topicId];
        }

        function recordAnswer(topicId, isCorrect) {
            const progress = getTopicProgress(topicId);
            const wasMastered = progress.mastered;
            let pointsEarned = 0;
            progress.attempts++;
            gameState.stats.totalProblemsAttempted++;
            if (isCorrect) {
                progress.streak++;
                progress.correctAnswers++;
                gameState.stats.totalProblemsCorrect++;
                pointsEarned = 100 + (progress.streak * 25);
                if (progress.streak >= MASTERY_THRESHOLD && !progress.mastered) {
                    progress.mastered = true;
                    gameState.stats.totalTopicsMastered++;
                    pointsEarned += 1000;
                }
                gameState.stats.totalPoints += pointsEarned;
            } else {
                progress.streak = 0;
            }
            saveToStorage();
            return { correct: isCorrect, streak: progress.streak, mastered: progress.mastered, justMastered: progress.mastered && !wasMastered, pointsEarned };
        }

        function isTopicMastered(topicId) { const p = gameState.topics[topicId]; return p ? p.mastered : false; }
        function getTopicStreak(topicId) { const p = gameState.topics[topicId]; return p ? p.streak : 0; }
        function countMasteredTopics(topicIds) { return topicIds.filter(id => isTopicMastered(id)).length; }
        function areAllTopicsMastered(topicIds) { return topicIds.every(id => isTopicMastered(id)); }

        function collectRune(regionId) {
            if (!gameState.runes[regionId]) {
                gameState.runes[regionId] = true;
                gameState.stats.totalPoints += 2500;
                saveToStorage();
                return true;
            }
            return false;
        }

        function hasRune(regionId) { return gameState.runes[regionId] === true; }
        function countRunes() { return Object.values(gameState.runes).filter(v => v).length; }
        function hasAllRunes() { return countRunes() === 9; }
        function setCurrentRegion(regionId) { gameState.currentRegion = regionId; saveToStorage(); }
        function setCurrentTopic(topicId) { gameState.currentTopic = topicId; saveToStorage(); }
        function getCurrentRegion() { return gameState.currentRegion; }
        function getCurrentTopic() { return gameState.currentTopic; }
        function markIntroSeen() { gameState.hasSeenIntro = true; saveToStorage(); }
        function hasSeenIntro() { return gameState.hasSeenIntro; }
        function markGameCompleted() { gameState.gameCompleted = true; saveToStorage(); }
        function getStats() { return { ...gameState.stats }; }
        function isRegionAvailable(regionId) {
            const available = ['the-shore','the-colony','the-tavern','the-frontier','the-divided-house','the-factory','the-home-front','the-march','the-mall'];
            return available.includes(regionId);
        }

        return {
            MASTERY_THRESHOLD, initGame, newGame, getState, hasSavedGame, clearSave, saveToStorage,
            getTopicProgress, recordAnswer, isTopicMastered, getTopicStreak, countMasteredTopics,
            areAllTopicsMastered, collectRune, hasRune, countRunes, hasAllRunes,
            setCurrentRegion, setCurrentTopic, getCurrentRegion, getCurrentTopic,
            markIntroSeen, hasSeenIntro, markGameCompleted, getStats, isRegionAvailable,
            loadFromCloud, syncWithCloud
        };
    })();

    // ============================================
    // NAME FILTER MODULE
    // ============================================
    const NameFilter = (function() {
        const blocklist = [
            'fuck','shit','ass','bitch','damn','crap','hell','dick','cock','pussy','cunt','fag','slut','whore',
            'nigger','nigga','retard','spic','chink','kike','dyke','tranny','faggot',
            'porn','sex','nude','naked','penis','vagina','boob','tits','anal','oral','dildo','cum',
            'weed','cocaine','heroin','meth','kill','murder','rape','nazi','hitler','bomb','gun','shoot'
        ];
        const leetMap = {'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','8':'b','@':'a','$':'s','!':'i','(':'c',')':'o','|':'i','+':'t'};

        function normalize(str) {
            let n = str.toLowerCase();
            for (const [l, c] of Object.entries(leetMap)) n = n.split(l).join(c);
            return n.replace(/[^a-z]/g, '');
        }
        function containsBadWord(name) { const n = normalize(name); return blocklist.some(w => n.includes(w)); }
        function isValid(name) {
            if (!name || name.length < 2 || name.length > 15) return false;
            if (!/^[a-zA-Z0-9 ._-]+$/.test(name)) return false;
            if (containsBadWord(name)) return false;
            return true;
        }
        function sanitize(name) { return name.trim().substring(0, 15); }
        function getErrorMessage(name) {
            if (!name || name.length < 2) return 'Name must be at least 2 characters';
            if (name.length > 15) return 'Name must be 15 characters or less';
            if (!/^[a-zA-Z0-9 ._-]+$/.test(name)) return 'Only letters, numbers, spaces, and . _ - allowed';
            if (containsBadWord(name)) return 'Please choose an appropriate name';
            return '';
        }
        return { isValid, sanitize, containsBadWord, getErrorMessage };
    })();

    // ============================================
    // LEADERBOARD MODULE
    // ============================================
    const Leaderboard = (function() {
        let db = null;
        let playerId = null;
        let isInitialized = false;

        function generatePlayerId() { return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); }

        function init(firebaseConfig) {
            if (isInitialized) return true;
            try {
                if (typeof firebase === 'undefined') { console.warn('Firebase SDK not loaded.'); return false; }
                if (firebase.apps.length === 0) firebase.initializeApp(firebaseConfig);
                db = firebase.database();
                playerId = localStorage.getItem('manifest_destined_player_id');
                if (!playerId) {
                    playerId = generatePlayerId();
                    localStorage.setItem('manifest_destined_player_id', playerId);
                }
                isInitialized = true;
                return true;
            } catch(e) { console.error('Failed to initialize Firebase:', e); return false; }
        }

        function isReady() { return isInitialized && db !== null; }
        function getPlayerId() { return playerId; }

        function submitScore(name, points) {
            if (!isReady()) return Promise.reject(new Error('Leaderboard not initialized'));
            if (!NameFilter.isValid(name)) return Promise.reject(new Error('Invalid name'));
            const sanitizedName = NameFilter.sanitize(name);
            return db.ref('leaderboard/' + playerId).set({ name: sanitizedName, points, timestamp: Date.now() });
        }

        function getTopScores(limit) {
            limit = limit || 20;
            if (!isReady()) return Promise.reject(new Error('Leaderboard not initialized'));
            return db.ref('leaderboard').orderByChild('points').limitToLast(limit).once('value').then(function(snapshot) {
                const scores = [];
                snapshot.forEach(function(child) {
                    scores.push({ id: child.key, name: child.val().name, points: child.val().points, timestamp: child.val().timestamp });
                });
                return scores.reverse();
            });
        }

        function hasSubmitted() {
            if (!isReady()) return Promise.resolve(false);
            return db.ref('leaderboard/' + playerId).once('value').then(s => s.exists());
        }

        return { init, isReady, getPlayerId, submitScore, getTopScores, hasSubmitted };
    })();

    // ============================================
    // AUTH MODULE
    // ============================================
    const Auth = (function() {
        let auth = null;
        let currentUser = null;
        let onAuthChangeCallback = null;
        function init() {
            if (typeof firebase === 'undefined' || !firebase.auth) { console.warn('Firebase Auth SDK not loaded'); return false; }
            auth = firebase.auth();
            auth.onAuthStateChanged(function(user) {
                if (user) {
                    currentUser = user;
                } else { currentUser = null; }
                if (onAuthChangeCallback) onAuthChangeCallback(currentUser);
            });
            return true;
        }

        function signInWithGoogle() {
            if (!auth) return Promise.reject(new Error('Auth not initialized'));
            const provider = new firebase.auth.GoogleAuthProvider();
            return auth.signInWithPopup(provider).then(r => r.user).catch(e => { console.error('Sign-in error:', e); throw e; });
        }

        function signOut() { if (!auth) return Promise.resolve(); return auth.signOut(); }
        function getCurrentUser() { return currentUser; }
        function isSignedIn() { return currentUser !== null; }
        function getUserId() { return currentUser ? currentUser.uid : null; }
        function getDisplayName() {
            if (!currentUser) return null;
            const name = currentUser.displayName || currentUser.email.split('@')[0];
            return name.split(' ')[0];
        }
        function getEmail() { return currentUser ? currentUser.email : null; }
        function onAuthStateChanged(callback) {
            onAuthChangeCallback = callback;
            if (currentUser) callback(currentUser);
        }

        return { init, signInWithGoogle, signOut, getCurrentUser, isSignedIn, getUserId, getDisplayName, getEmail, onAuthStateChanged };
    })();

    // ============================================
    // CLOUD SAVE MODULE
    // ============================================
    const CloudSave = (function() {
        let db = null;
        let saveTimeout = null;
        const SAVE_DELAY = 2000;

        function init() {
            if (typeof firebase === 'undefined' || !firebase.database) { console.warn('Firebase Database not available'); return false; }
            db = firebase.database();
            return true;
        }

        function saveProgress(userId, gameState) {
            if (!db || !userId) return Promise.resolve(false);
            if (saveTimeout) clearTimeout(saveTimeout);
            return new Promise(function(resolve) {
                saveTimeout = setTimeout(function() {
                    db.ref('players/' + userId + '/progress').set({ gameState, lastSaved: Date.now() })
                        .then(() => resolve(true)).catch(e => { console.error('Failed to save:', e); resolve(false); });
                }, SAVE_DELAY);
            });
        }

        function loadProgress(userId) {
            if (!db || !userId) return Promise.resolve(null);
            return db.ref('players/' + userId + '/progress').once('value').then(function(snapshot) {
                if (snapshot.exists()) return snapshot.val().gameState;
                return null;
            }).catch(e => { console.error('Failed to load:', e); return null; });
        }

        function deleteProgress(userId) {
            if (!db || !userId) return Promise.resolve(false);
            return db.ref('players/' + userId + '/progress').remove().then(() => true).catch(() => false);
        }

        return { init, saveProgress, loadProgress, deleteProgress };
    })();

    // ============================================
    // LOCATIONS MODULE
    // ============================================
    const Locations = (function() {
        const regions = {
            'the-shore': {
                id: 'the-shore', name: 'The Shore', unit: 1, unitName: 'Period 1: 1491-1607',
                icon: '🌊', runeSymbol: '⚓',
                description: '<p>You arrive at the edge of a vast, unknown continent. Indigenous peoples have built complex civilizations across this land for thousands of years. Then European ships appear on the horizon.</p><p>Master the world before and after European contact — from the diverse Native American cultures to the first age of exploration and colonization.</p>',
                runeMessage: 'You have mastered the first contact between worlds. The Medallion of the Shore honors your understanding of this pivotal era.',
                topics: [
                    { id: '1.1', name: 'Native American Societies Before Contact' },
                    { id: '1.2', name: 'European Exploration and Motives' },
                    { id: '1.3', name: 'First Contacts: Exchange and Conflict' },
                    { id: '1.4', name: 'Spanish Colonization and the Encomienda System' },
                    { id: '1.5', name: 'Other European Powers: France, England, Netherlands' },
                    { id: '1.6', name: 'Columbian Exchange and Its Consequences' }
                ]
            },
            'the-colony': {
                id: 'the-colony', name: 'The Colony', unit: 2, unitName: 'Period 2: 1607-1754',
                icon: '⚜️', runeSymbol: '🌿',
                description: '<p>The first permanent English settlers cling to survival at Jamestown. Across the Atlantic coast, distinct colonial societies take shape — from Puritan New England to the tobacco-growing Chesapeake to the diverse Middle Colonies.</p><p>Understand how colonial America grew, how slavery became entrenched, and how colonists forged new identities.</p>',
                runeMessage: 'You have navigated the world of colonial America. The Medallion of the Colony marks your mastery of this formative era.',
                topics: [
                    { id: '2.1', name: 'Chesapeake Colonies: Virginia and Maryland' },
                    { id: '2.2', name: 'New England Colonies: Puritans and Pilgrims' },
                    { id: '2.3', name: 'Middle and Southern Colonies' },
                    { id: '2.4', name: 'Colonial Society, Economy, and Culture' },
                    { id: '2.5', name: 'Slavery and the Atlantic Slave Trade' },
                    { id: '2.6', name: 'Colonial Conflicts: Wars and Native Relations' }
                ]
            },
            'the-tavern': {
                id: 'the-tavern', name: 'The Tavern', unit: 3, unitName: 'Period 3: 1754-1800',
                icon: '🍺', runeSymbol: '🦅',
                description: '<p>The air crackles with revolutionary talk. From the French and Indian War to cries of "no taxation without representation," a new nation is being born. Colonists argue over liberty, taxation, and the meaning of self-government.</p><p>Master the Revolution, the founding documents, and the difficult first decades of the American republic.</p>',
                runeMessage: 'You have witnessed the birth of a nation. The Medallion of the Tavern honors your mastery of the Revolutionary era.',
                topics: [
                    { id: '3.1', name: 'French and Indian War and Its Consequences' },
                    { id: '3.2', name: 'Road to Revolution: Colonial Resistance' },
                    { id: '3.3', name: 'American Revolution: Causes and Course' },
                    { id: '3.4', name: 'Articles of Confederation and Its Weaknesses' },
                    { id: '3.5', name: 'Constitutional Convention and the New Government' },
                    { id: '3.6', name: 'The Early Republic: Federalists vs. Republicans' }
                ]
            },
            'the-frontier': {
                id: 'the-frontier', name: 'The Frontier', unit: 4, unitName: 'Period 4: 1800-1848',
                icon: '🌾', runeSymbol: '🌅',
                description: '<p>The young republic stretches westward. Settlers cross the Appalachians, politicians debate the nature of democracy, and reform movements challenge the nation to live up to its ideals. The Market Revolution transforms everyday life.</p><p>Master Jacksonian democracy, westward expansion, and the great antebellum reform movements.</p>',
                runeMessage: 'You have traversed the frontier of early American democracy. The Medallion of the Frontier is yours.',
                topics: [
                    { id: '4.1', name: 'Jefferson and the Era of Good Feelings' },
                    { id: '4.2', name: 'Market Revolution and Transportation' },
                    { id: '4.3', name: 'Jacksonian Democracy and Its Critics' },
                    { id: '4.4', name: 'Westward Expansion and Manifest Destiny' },
                    { id: '4.5', name: 'Reform Movements: Abolition, Temperance, Women\'s Rights' },
                    { id: '4.6', name: 'The Second Great Awakening' }
                ]
            },
            'the-divided-house': {
                id: 'the-divided-house', name: 'The Divided House', unit: 5, unitName: 'Period 5: 1844-1877',
                icon: '⚔️', runeSymbol: '⚖',
                description: '<p>A house divided against itself cannot stand. The issue of slavery tears the nation apart — from the Compromise of 1850 to Fort Sumter to the blood-soaked battlefields of the Civil War. Then comes the hard work of Reconstruction.</p><p>Master the sectional crisis, the Civil War, and the struggle to rebuild a nation.</p>',
                runeMessage: 'You have survived the nation\'s greatest trial. The Medallion of the Divided House honors your understanding of this tragic era.',
                topics: [
                    { id: '5.1', name: 'Sectional Crisis: Slavery and Compromise' },
                    { id: '5.2', name: 'Road to Civil War: The 1850s' },
                    { id: '5.3', name: 'The Civil War: Causes and Course' },
                    { id: '5.4', name: 'Lincoln, Emancipation, and War Aims' },
                    { id: '5.5', name: 'Reconstruction: Goals and Implementation' },
                    { id: '5.6', name: 'End of Reconstruction and Its Legacy' }
                ]
            },
            'the-factory': {
                id: 'the-factory', name: 'The Factory', unit: 6, unitName: 'Period 6: 1865-1898',
                icon: '⚙️', runeSymbol: '⚙',
                description: '<p>Steel mills roar, railroad tracks stretch coast to coast, and tycoons amass unprecedented fortunes. But workers toil in dangerous conditions, farmers struggle under debt, and Native Americans face the loss of their lands.</p><p>Master the Gilded Age, the rise of industrial capitalism, and the birth of American imperialism.</p>',
                runeMessage: 'You understand the costs and rewards of America\'s industrial transformation. The Medallion of the Factory is forged in your honor.',
                topics: [
                    { id: '6.1', name: 'Industrialization and the Gilded Age' },
                    { id: '6.2', name: 'Robber Barons, Trusts, and Big Business' },
                    { id: '6.3', name: 'Labor Movements and Working Conditions' },
                    { id: '6.4', name: 'The New South and Jim Crow' },
                    { id: '6.5', name: 'The West: Settlement, Cowboys, and Native Americans' },
                    { id: '6.6', name: 'American Imperialism and the Spanish-American War' }
                ]
            },
            'the-home-front': {
                id: 'the-home-front', name: 'The Home Front', unit: 7, unitName: 'Period 7: 1890-1945',
                icon: '🏠', runeSymbol: '★',
                description: '<p>Reformers challenge corporate power in the Progressive Era, America enters the Great War, flappers dance in the Roaring Twenties, and then the Depression plunges millions into poverty. Then comes the Second World War.</p><p>Master five decades of upheaval, from the Progressive movement through America\'s triumph in World War II.</p>',
                runeMessage: 'You have lived through America\'s most turbulent half-century. The Medallion of the Home Front is yours.',
                topics: [
                    { id: '7.1', name: 'Progressive Era: Reform and Regulation' },
                    { id: '7.2', name: 'World War I and American Involvement' },
                    { id: '7.3', name: 'The Roaring Twenties: Prosperity and Change' },
                    { id: '7.4', name: 'The Great Depression and the New Deal' },
                    { id: '7.5', name: 'Road to World War II' },
                    { id: '7.6', name: 'World War II: Home Front and Victory' }
                ]
            },
            'the-march': {
                id: 'the-march', name: 'The March', unit: 8, unitName: 'Period 8: 1945-1980',
                icon: '✊', runeSymbol: '✌',
                description: '<p>American soldiers come home victorious, but new battles begin. The Cold War brings nuclear anxiety, while African Americans and others march for their rights. Vietnam tears the nation apart again. Social movements reshape American society.</p><p>Master the Cold War, Civil Rights Movement, and the social upheavals of the postwar era.</p>',
                runeMessage: 'You have marched through the defining struggles of postwar America. The Medallion of the March recognizes your mastery.',
                topics: [
                    { id: '8.1', name: 'Origins and Early Cold War' },
                    { id: '8.2', name: 'Korean War, McCarthyism, and the 1950s' },
                    { id: '8.3', name: 'Civil Rights Movement' },
                    { id: '8.4', name: 'The 1960s: Great Society and Vietnam' },
                    { id: '8.5', name: 'Social Movements: Women\'s Rights, Environment, Identity' },
                    { id: '8.6', name: 'Nixon, Watergate, and the 1970s' }
                ]
            },
            'the-mall': {
                id: 'the-mall', name: 'The Mall', unit: 9, unitName: 'Period 9: 1980-Present',
                icon: '🌐', runeSymbol: '🗽',
                description: '<p>Reagan\'s revolution reshapes American politics. The Cold War ends without a shot — but new threats emerge. The Internet transforms society, 9/11 changes America\'s role in the world, and debates over identity and inequality define the era.</p><p>Master the conservative turn, globalization, and America\'s 21st-century challenges.</p>',
                runeMessage: 'You have mastered all nine eras of American history. The Medallion of the Mall and the title of History Champion are yours!',
                topics: [
                    { id: '9.1', name: 'Reagan Revolution and New Conservatism' },
                    { id: '9.2', name: 'End of the Cold War' },
                    { id: '9.3', name: 'Culture Wars and Social Change in the 1990s' },
                    { id: '9.4', name: 'Globalization and the New Economy' },
                    { id: '9.5', name: '9/11 and the War on Terror' },
                    { id: '9.6', name: '21st Century Challenges and Continuities' }
                ]
            }
        };

        function getRegion(regionId) { return regions[regionId] || null; }
        function getAllRegions() { return Object.values(regions); }
        function getRegionIds() { return Object.keys(regions); }

        return { regions, getRegion, getAllRegions, getRegionIds };
    })();

    // ============================================
    // LESSONS MODULE - AP US History
    // ============================================
    const Lessons = (function() {
        const lessons = {
            // Unit 1: Period 1 — 1491-1607
            '1.1': {
                id: '1.1', title: 'Native American Societies Before Contact',
                content: '<h3>A Diverse Continent</h3><p>Before 1492, the Americas were home to millions of people organized into hundreds of distinct cultures, languages, and political systems.</p><div class="definition"><strong>Pre-Columbian:</strong> The period in the Americas before European arrival in 1492.</div><h3>Major Cultural Regions</h3><ul><li><strong>Eastern Woodlands:</strong> Iroquois Confederacy, Algonquian peoples — farming, hunting, complex diplomacy</li><li><strong>Great Plains:</strong> Lakota, Comanche — semi-nomadic, reliant on bison</li><li><strong>Southwest:</strong> Pueblo peoples (Hopi, Zuni) — agriculture, cliff dwellings, irrigation</li><li><strong>Pacific Northwest:</strong> Chinook, Tlingit — fishing, potlatch ceremonies, totem poles</li><li><strong>Mesoamerica:</strong> Aztec, Maya — urban centers, writing, astronomy</li></ul><h3>Key Characteristics</h3><p>Most Native societies were organized around kinship groups. Many were matrilineal (descent through the mother). Trade networks connected distant regions. Religion was deeply integrated with daily life and the natural world.</p><div class="key-concept">Native American societies were not primitive but complex civilizations adapted to diverse environments.</div>'
            },
            '1.2': {
                id: '1.2', title: 'European Exploration and Motives',
                content: '<h3>Why Europeans Explored</h3><p>Beginning in the 15th century, European nations competed to find new trade routes to Asia and to expand their wealth and power.</p><h3>The Three Gs</h3><ul><li><strong>Gold:</strong> Desire for wealth — particularly spices, silk, and precious metals from Asia</li><li><strong>Glory:</strong> National prestige, personal fame, and adventure</li><li><strong>God:</strong> Spreading Christianity to new peoples</li></ul><h3>Portugal Leads the Way</h3><p>Portugal pioneered exploration under <strong>Prince Henry the Navigator</strong>, developing better ships (the caravel), navigation instruments (astrolabe, compass), and sailing down the African coast. In 1498, <strong>Vasco da Gama</strong> reached India.</p><h3>Spain Enters the Race</h3><p><strong>Christopher Columbus</strong>, funded by Spain, reached the Caribbean in 1492 believing he had found Asia. His voyages opened a new era of transatlantic contact. <strong>Amerigo Vespucci</strong> later recognized these were continents previously unknown to Europeans.</p><div class="key-concept">European exploration was driven by economics, religion, and competition among rival states.</div>'
            },
            '1.3': {
                id: '1.3', title: 'First Contacts: Exchange and Conflict',
                content: '<h3>The Meeting of Worlds</h3><p>The arrival of Europeans in the Americas created interactions that were sometimes peaceful but often violent, always transformative for both sides.</p><h3>Columbus and the Caribbean</h3><p>Columbus encountered the Taino people of the Caribbean. His reports sparked Spanish interest in conquest. The Taino were quickly decimated by disease and forced labor.</p><h3>The Aztec Empire</h3><p><strong>Hernan Cortes</strong> conquered the Aztec Empire (1519-1521) with fewer than 600 soldiers — aided by:<ul><li>European diseases (especially smallpox)</li><li>Indigenous allies who resented Aztec rule</li><li>Superior weapons (steel, horses, gunpowder)</li></ul><strong>Montezuma II</strong> led the Aztecs and was killed during the conquest.</p><h3>The Inca Empire</h3><p><strong>Francisco Pizarro</strong> conquered the Inca Empire in Peru (1532-1535), following a similar pattern.</p><div class="key-concept">European conquest succeeded through a combination of disease, military technology, and exploiting existing divisions among Native peoples.</div>'
            },
            '1.4': {
                id: '1.4', title: 'Spanish Colonization and the Encomienda System',
                content: '<h3>Building a Colonial Empire</h3><p>Spain created the first large-scale European colonial empire in the Americas, stretching from the Caribbean to South America and into North America.</p><div class="definition"><strong>Encomienda:</strong> A system granting Spanish colonists (encomenderos) authority over Native American workers in exchange for religious instruction. In practice, it was forced labor.</div><h3>Colonial Society (Casta System)</h3><ul><li><strong>Peninsulares:</strong> Born in Spain, held highest positions</li><li><strong>Criollos:</strong> Spanish ancestry, born in Americas</li><li><strong>Mestizos:</strong> Mixed Spanish-Native ancestry</li><li><strong>Indios/Africans:</strong> At the bottom of the hierarchy</li></ul><h3>The Black Legend</h3><p>Friar <strong>Bartolome de las Casas</strong> documented Spanish cruelties against Native peoples, creating the "Black Legend" — the idea that Spanish colonialism was uniquely brutal. His writings were used by rival European powers to condemn Spain.</p><h3>The Mission System</h3><p>Franciscan and Jesuit missionaries established missions to convert Native peoples and used their labor, often in conditions resembling slavery.</p><div class="key-concept">Spanish colonialism created a hierarchical society based on race and place of birth, while the encomienda system devastated Native populations.</div>'
            },
            '1.5': {
                id: '1.5', title: 'Other European Powers: France, England, Netherlands',
                content: '<h3>Europe Competes for the Americas</h3><p>After Spain\'s success, France, England, and the Netherlands sought their own American colonies and trade routes.</p><h3>France</h3><ul><li>Focused on the fur trade with Native Americans in Canada</li><li><strong>Jacques Cartier</strong> explored the St. Lawrence River</li><li><strong>Samuel de Champlain</strong> founded Quebec (1608)</li><li>French missionaries (Jesuits) worked closely with Native peoples</li><li>New France was sparsely populated but had extensive trade networks</li></ul><h3>England</h3><ul><li><strong>John Cabot</strong> explored North America for England (1497)</li><li>Sir Walter Raleigh\'s <strong>Roanoke Colony</strong> (1585) mysteriously disappeared</li><li>England was motivated partly by Protestantism — competing with Catholic Spain</li></ul><h3>Netherlands</h3><ul><li><strong>Henry Hudson</strong> explored the Hudson River (1609) for the Dutch</li><li>Founded New Netherland (later New York), centered on the fur trade</li><li>Dutch West India Company controlled the colony</li></ul><div class="key-concept">Each European power had a distinct colonial strategy — Spain focused on conquest and silver, France on the fur trade, England on settlement, and the Dutch on commerce.</div>'
            },
            '1.6': {
                id: '1.6', title: 'Columbian Exchange and Its Consequences',
                content: '<h3>A Global Exchange</h3><p>The contact between Europeans and the Americas created a massive, permanent exchange of plants, animals, diseases, and people that transformed both hemispheres.</p><div class="definition"><strong>Columbian Exchange:</strong> The transfer of plants, animals, diseases, and people between the Eastern and Western Hemispheres following Columbus\'s voyages.</div><h3>From the Americas to Europe/Africa</h3><ul><li><strong>Foods:</strong> Potato, tomato, corn (maize), cacao, tobacco, sweet potato</li><li><strong>Impact:</strong> Potatoes and corn increased European food supply, supporting population growth</li></ul><h3>From Europe/Africa to the Americas</h3><ul><li><strong>Animals:</strong> Horses, cattle, pigs, chickens (transformed Native societies)</li><li><strong>Crops:</strong> Wheat, rice, sugarcane</li><li><strong>Diseases:</strong> Smallpox, measles, typhus — catastrophic for Native peoples</li></ul><h3>Demographic Catastrophe</h3><p>Disease killed an estimated 50-90% of Native American populations within a century of contact — the greatest demographic catastrophe in human history. This "Great Dying" changed the ecological landscape of the Americas.</p><div class="key-concept">The Columbian Exchange transformed global ecology, diets, and demographics — creating the interconnected world we live in today.</div>'
            },
            // Unit 2: Period 2 — 1607-1754
            '2.1': {
                id: '2.1', title: 'Chesapeake Colonies: Virginia and Maryland',
                content: '<h3>The First Permanent English Colony</h3><p><strong>Jamestown, Virginia (1607)</strong> was the first permanent English settlement in North America, founded by the Virginia Company for profit.</p><h3>Early Struggles</h3><ul><li>Settlers were ill-suited for survival — many were gentlemen seeking gold</li><li>"Starving Time" (1609-1610) killed most colonists</li><li><strong>John Smith</strong> imposed discipline: "He who will not work, shall not eat"</li><li>Relations with Powhatan Confederacy were tense; Pocahontas became a cultural intermediary</li></ul><h3>Tobacco Saves Virginia</h3><p><strong>John Rolfe</strong> developed a marketable tobacco strain (1612). By 1619, Virginia had its first representative assembly — the <strong>House of Burgesses</strong> — and its first enslaved Africans.</p><h3>Maryland</h3><p>Founded in 1634 by Lord Baltimore (George Calvert) as a refuge for Catholics. The <strong>Act of Toleration (1649)</strong> granted religious freedom to all Christians.</p><h3>Bacon\'s Rebellion (1676)</h3><p>Nathaniel Bacon led frontier farmers against Governor Berkeley. The rebellion revealed class tensions and pushed planters toward enslaved labor as a more controllable workforce.</p><div class="key-concept">The Chesapeake colonies developed around tobacco, representative government, and — ultimately — slavery.</div>'
            },
            '2.2': {
                id: '2.2', title: 'New England Colonies: Puritans and Pilgrims',
                content: '<h3>Religious Motivation</h3><p>Unlike the Chesapeake, New England colonies were founded primarily for religious reasons.</p><h3>The Pilgrims and Plymouth</h3><p>The <strong>Separatists</strong> (Pilgrims) sailed on the Mayflower in 1620, signing the <strong>Mayflower Compact</strong> — an agreement to govern themselves. They landed at Plymouth, Massachusetts, and were aided by <strong>Squanto</strong> and the Wampanoag people.</p><h3>The Puritans and Massachusetts Bay</h3><p>In 1630, <strong>John Winthrop</strong> led 20,000 Puritans to found Massachusetts Bay Colony — a "City upon a Hill." Puritans sought to purify the Church of England and create a godly community.</p><h3>Puritan Society</h3><ul><li>Literacy was highly valued (to read the Bible)</li><li>Town meetings fostered local democracy</li><li>Religious dissenters were expelled: <strong>Roger Williams</strong> founded Rhode Island; <strong>Anne Hutchinson</strong> was banished for antinomianism</li></ul><h3>King Philip\'s War (1675-76)</h3><p>Native leader <strong>Metacom (King Philip)</strong> led a devastating war against English settlers. The English eventually won but at enormous cost to both sides.</p><div class="key-concept">New England\'s Puritan legacy shaped American values of education, civic participation, and the idea of a divine mission.</div>'
            },
            '2.3': {
                id: '2.3', title: 'Middle and Southern Colonies',
                content: '<h3>The Middle Colonies</h3><p>New York, New Jersey, Pennsylvania, and Delaware were known for their diversity and commercial activity.</p><ul><li><strong>New York:</strong> Taken from the Dutch in 1664, remained diverse and commercial</li><li><strong>Pennsylvania:</strong> Founded by <strong>William Penn</strong> (Quaker) in 1681 as a "holy experiment" with religious tolerance and fair treatment of Native Americans</li><li><strong>Delaware:</strong> Originally Swedish, later part of Penn\'s holdings</li></ul><h3>The Southern Colonies</h3><ul><li><strong>Carolina</strong> (later North and South): Founded 1663, relied heavily on enslaved labor for rice and indigo cultivation</li><li><strong>Georgia</strong> (1733): Founded by <strong>James Oglethorpe</strong> as a buffer against Spain and as a refuge for debtors — though it later adopted slavery</li></ul><h3>Comparing Colonial Regions</h3><p>The colonies differed sharply in economy, religion, and society — foreshadowing later regional tensions.</p><div class="key-concept">The Middle Colonies were the most ethnically and religiously diverse, while the Southern Colonies developed plantation economies reliant on enslaved labor.</div>'
            },
            '2.4': {
                id: '2.4', title: 'Colonial Society, Economy, and Culture',
                content: '<h3>Colonial Economy</h3><p>England\'s colonies fit into the mercantile system — providing raw materials and buying manufactured goods from England.</p><div class="definition"><strong>Mercantilism:</strong> Economic theory that colonies exist to enrich the mother country through providing raw materials and serving as a captive market.</div><h3>Navigation Acts</h3><p>England passed Navigation Acts (1651-1673) requiring colonial trade to go through English ships and ports. Colonists often evaded them through smuggling.</p><h3>The Great Awakening</h3><p>A religious revival movement (1730s-1740s) led by preachers like <strong>Jonathan Edwards</strong> ("Sinners in the Hands of an Angry God") and <strong>George Whitefield</strong>. It emphasized personal conversion, undermined church authority, and democratized religion — planting seeds of individualism.</p><h3>Enlightenment in the Colonies</h3><p><strong>Benjamin Franklin</strong> embodied Enlightenment values — reason, science, self-improvement. Colonial thinkers were influenced by <strong>John Locke</strong>\'s ideas about natural rights and government by consent.</p><div class="key-concept">Colonial culture blended Puritan religiosity, Enlightenment reason, and a growing sense of "American" identity distinct from England.</div>'
            },
            '2.5': {
                id: '2.5', title: 'Slavery and the Atlantic Slave Trade',
                content: '<h3>The Origins of American Slavery</h3><p>Slavery developed gradually in the English colonies. The first Africans arrived in Virginia in 1619 as indentured servants, but by the 1660s, laws defined Black people as slaves for life.</p><h3>The Atlantic Slave Trade</h3><p>The <strong>Middle Passage</strong> — the voyage across the Atlantic — was brutal. Enslaved Africans were packed tightly in ships, with mortality rates of 15-25%. An estimated 12 million Africans were transported to the Americas between 1500-1900.</p><h3>Slavery Across the Colonies</h3><ul><li><strong>Southern colonies:</strong> Plantation slavery for tobacco, rice, indigo — large enslaved populations</li><li><strong>Northern colonies:</strong> Smaller numbers; domestic service, skilled trades, dock work</li><li><strong>Chesapeake:</strong> Slave codes hardened in the 1660s-1680s, creating race-based chattel slavery</li></ul><h3>Resistance</h3><p>Enslaved people resisted through slow work, sabotage, flight, and occasional uprisings. The <strong>Stono Rebellion (1739)</strong> in South Carolina was one of the largest slave revolts in colonial America.</p><div class="key-concept">American slavery was a race-based, hereditary system that became central to the Southern economy and deeply shaped American society.</div>'
            },
            '2.6': {
                id: '2.6', title: 'Colonial Conflicts: Wars and Native Relations',
                content: '<h3>Conflict with Native Americans</h3><p>Colonial expansion constantly encroached on Native lands, leading to repeated cycles of war and displacement.</p><h3>Major Conflicts</h3><ul><li><strong>Pequot War (1637):</strong> Connecticut colonists and Mohegan allies nearly exterminated the Pequot people</li><li><strong>King Philip\'s War (1675-76):</strong> Deadliest per capita war in American history; devastated both sides</li><li><strong>Pueblo Revolt (1680):</strong> Pueblo peoples drove Spanish out of New Mexico for 12 years — the most successful Native revolt against European colonizers</li></ul><h3>Intercolonial Wars</h3><p>European colonial wars spilled into America:</p><ul><li><strong>King William\'s War (1689-97), Queen Anne\'s War (1702-13)</strong> — colonial versions of European conflicts between England and France/Spain</li><li>These wars forged a sense of shared identity among English colonists</li></ul><h3>Native Diplomacy</h3><p>Many Native nations played European powers against each other, maintaining sovereignty through strategic alliances. The <strong>Iroquois Confederacy</strong> was particularly skilled at this "play-off system."</p><div class="key-concept">Colonial conflicts with Native Americans were driven by land hunger and European imperial rivalry, steadily pushing Native peoples westward.</div>'
            },
            // Unit 3: Period 3 — 1754-1800
            '3.1': {
                id: '3.1', title: 'French and Indian War and Its Consequences',
                content: '<h3>The Global Conflict</h3><p>The <strong>French and Indian War (1754-1763)</strong> — called the Seven Years\' War in Europe — was a global struggle between Britain and France. In North America, most Native Americans sided with France.</p><h3>Causes and Course</h3><p>The war began over conflicting claims in the Ohio River Valley. A young George Washington\'s 1754 expedition sparked the fighting. Britain ultimately won, with General Wolfe defeating Montcalm at Quebec (1759).</p><h3>The Treaty of Paris (1763)</h3><p>France gave Canada and land east of the Mississippi to Britain. Spain received Louisiana west of the Mississippi. France\'s North American empire was ended.</p><h3>Consequences for the Colonies</h3><ul><li><strong>Proclamation of 1763:</strong> Britain forbade colonists from settling west of the Appalachians — to avoid conflict with Native Americans. Colonists resented this.</li><li>Britain\'s huge war debt led to new taxes on the colonies</li><li>The war experience made colonists feel capable of defending themselves</li><li>Native Americans who had allied with France lost their protector</li></ul><div class="key-concept">The French and Indian War planted the seeds of the American Revolution by changing British colonial policy and awakening colonial self-confidence.</div>'
            },
            '3.2': {
                id: '3.2', title: 'Road to Revolution: Colonial Resistance',
                content: '<h3>A Changing Relationship</h3><p>After the French and Indian War, Britain tried to tighten control over the colonies and raise revenue to pay war debts. Colonists resisted under the slogan "No taxation without representation."</p><h3>Key Acts and Colonial Responses</h3><ul><li><strong>Stamp Act (1765):</strong> First direct internal tax on colonists; led to the Stamp Act Congress and widespread protest</li><li><strong>Townshend Acts (1767):</strong> Taxes on imported goods; led to boycotts and the Boston Massacre (1770)</li><li><strong>Tea Act (1773) / Boston Tea Party:</strong> Sons of Liberty dumped 342 chests of tea into Boston Harbor</li><li><strong>Intolerable Acts (1774):</strong> Britain\'s punishment — closed Boston Harbor, revoked Massachusetts\' charter</li></ul><h3>Colonial Organization</h3><p><strong>Samuel Adams</strong> organized Committees of Correspondence to coordinate resistance. The <strong>First Continental Congress (1774)</strong> brought colonies together to petition the king.</p><h3>Ideology</h3><p>Colonists used <strong>John Locke\'s</strong> natural rights philosophy — life, liberty, property. The idea of a "social contract" between rulers and the ruled justified resistance to tyranny.</p><div class="key-concept">Colonial resistance was rooted in both practical grievances (taxes) and political principle (representation and natural rights).</div>'
            },
            '3.3': {
                id: '3.3', title: 'American Revolution: Causes and Course',
                content: '<h3>The Shot Heard \'Round the World</h3><p>Fighting began at <strong>Lexington and Concord</strong> in April 1775. The Second Continental Congress met and appointed <strong>George Washington</strong> commander of the Continental Army.</p><h3>Declaring Independence</h3><p><strong>Thomas Jefferson</strong> drafted the <strong>Declaration of Independence</strong> (July 4, 1776), drawing on Enlightenment ideals:<ul><li>All men are created equal</li><li>Unalienable rights: life, liberty, pursuit of happiness</li><li>Government derives power from the consent of the governed</li><li>Right to alter or abolish unjust government</li></ul><strong>Thomas Paine\'s</strong> "Common Sense" (1776) persuaded ordinary people that independence was necessary.</p><h3>The War</h3><p>The war went badly at first for the Americans. The turning point was the <strong>Battle of Saratoga (1777)</strong>, which convinced France to ally with the Americans. French money, troops, and naval support proved decisive. <strong>Yorktown (1781)</strong> was the last major battle.</p><h3>Treaty of Paris (1783)</h3><p>Britain recognized American independence; the U.S. received land to the Mississippi River.</p><div class="key-concept">The Revolution was both a war for independence and a revolution in political thought — establishing self-government, natural rights, and popular sovereignty as American ideals.</div>'
            },
            '3.4': {
                id: '3.4', title: 'Articles of Confederation and Its Weaknesses',
                content: '<h3>The First National Government</h3><p>The Articles of Confederation (1781-1789) was America\'s first constitution — intentionally weak to avoid tyranny.</p><h3>Structure</h3><ul><li>One vote per state regardless of size</li><li>No executive branch, no national courts</li><li>Congress could not tax — only request money from states</li><li>9 of 13 states needed to pass laws; all 13 to amend</li></ul><h3>Successes</h3><ul><li><strong>Northwest Ordinance (1787):</strong> Organized the territory north of the Ohio River; banned slavery there; created a process for new states</li><li>Won the Revolution and negotiated the Treaty of Paris</li></ul><h3>Failures and Crises</h3><ul><li>Could not pay war debts or fund an army</li><li>States competed economically with each other</li><li>Could not force states to comply with treaties</li><li><strong>Shays\' Rebellion (1786-87):</strong> Massachusetts farmers revolted over debt and foreclosures; showed the government could not maintain order</li></ul><div class="key-concept">The Articles created an ineffective government that left the nation unable to solve its financial and diplomatic problems, leading to the Constitutional Convention.</div>'
            },
            '3.5': {
                id: '3.5', title: 'Constitutional Convention and the New Government',
                content: '<h3>The Convention</h3><p>In summer 1787, 55 delegates met in Philadelphia to revise the Articles. Instead, they wrote an entirely new Constitution.</p><h3>Major Compromises</h3><ul><li><strong>Great Compromise:</strong> Bicameral Congress — Senate (equal representation) + House (proportional representation)</li><li><strong>Three-Fifths Compromise:</strong> Enslaved people counted as 3/5 of a person for representation and taxation</li><li><strong>Commerce Compromise:</strong> Congress could regulate trade but couldn\'t tax exports or ban slave trade for 20 years</li></ul><h3>The Constitution\'s Framework</h3><ul><li><strong>Separation of powers:</strong> Legislative, executive, judicial branches</li><li><strong>Checks and balances:</strong> Each branch can limit the others</li><li><strong>Federalism:</strong> Power divided between national and state governments</li></ul><h3>Ratification Debate</h3><p><strong>Federalists</strong> (Hamilton, Madison, Jay — <em>The Federalist Papers</em>) argued for ratification. <strong>Anti-Federalists</strong> feared a strong central government. The <strong>Bill of Rights</strong> (1791) was added to secure ratification.</p><div class="key-concept">The Constitution created a stronger national government while protecting individual rights and maintaining the political system of federalism.</div>'
            },
            '3.6': {
                id: '3.6', title: 'The Early Republic: Federalists vs. Republicans',
                content: '<h3>Washington\'s Presidency</h3><p>George Washington set key precedents: two-term limit, cabinet system, neutrality in foreign wars, avoiding political parties (though he failed at the last one).</p><h3>Hamilton vs. Jefferson</h3><p>The first political debate split Washington\'s cabinet:</p><ul><li><strong>Alexander Hamilton</strong> (Federalist): Strong national government, national bank, manufacturing economy, loose interpretation of the Constitution, pro-British</li><li><strong>Thomas Jefferson</strong> (Democratic-Republican): States\' rights, agrarian economy, strict interpretation, pro-French</li></ul><h3>Key Events</h3><ul><li><strong>Whiskey Rebellion (1794):</strong> Washington used federal troops to crush tax revolt — showing federal authority</li><li><strong>XYZ Affair (1797-98):</strong> French demanded bribes; "Millions for defense, not one cent for tribute"</li><li><strong>Alien and Sedition Acts (1798):</strong> Federalists restricted free speech; Jefferson responded with Virginia and Kentucky Resolutions asserting states\' rights</li><li><strong>"Revolution of 1800":</strong> Jefferson won the presidency, proving peaceful transfer of power between parties</li></ul><div class="key-concept">The early republic established crucial precedents for democratic governance and revealed enduring tensions over federal vs. state power.</div>'
            },
            // Unit 4: Period 4 — 1800-1848
            '4.1': {
                id: '4.1', title: 'Jefferson and the Era of Good Feelings',
                content: '<h3>The Jeffersonian Era</h3><p>Thomas Jefferson\'s presidency (1801-1809) reshaped American politics, emphasizing agrarian democracy, limited government, and westward expansion.</p><h3>Louisiana Purchase (1803)</h3><p>Jefferson bought 828,000 square miles from Napoleon\'s France for $15 million — doubling the nation\'s size. The <strong>Lewis and Clark Expedition (1804-06)</strong> explored the new territory.</p><h3>Marshall Court</h3><p>Chief Justice <strong>John Marshall</strong> used the Supreme Court to strengthen federal power:</p><ul><li><strong>Marbury v. Madison (1803):</strong> Established judicial review</li><li><strong>McCulloch v. Maryland (1819):</strong> Affirmed federal supremacy and broad interpretation of federal powers</li><li><strong>Gibbons v. Ogden (1824):</strong> Expanded federal control over interstate commerce</li></ul><h3>Era of Good Feelings (1815-1825)</h3><p>After the War of 1812, a sense of national unity emerged under President Monroe. However, the <strong>Missouri Compromise (1820)</strong> revealed simmering sectional tensions over slavery: Missouri admitted as slave state, Maine as free, with slavery banned north of 36°30\'.</p><div class="key-concept">The early 19th century saw national expansion and unity — but also the first clear signs of sectional conflict over slavery.</div>'
            },
            '4.2': {
                id: '4.2', title: 'Market Revolution and Transportation',
                content: '<h3>Transforming the Economy</h3><p>Between 1800 and 1848, the American economy transformed from subsistence farming to a market-based system linked by new transportation networks.</p><div class="definition"><strong>Market Revolution:</strong> The transformation of the American economy as goods were increasingly produced for distant markets rather than local consumption.</div><h3>Transportation Revolution</h3><ul><li><strong>National Road (1811):</strong> First federally funded road</li><li><strong>Erie Canal (1825):</strong> Connected Great Lakes to New York City, transforming western commerce</li><li><strong>Railroads (1830s on):</strong> By 1860, 30,000 miles of track — the world\'s largest network</li><li><strong>Steamboats:</strong> Robert Fulton (1807) made river travel faster and cheaper</li></ul><h3>Industrial Revolution in America</h3><p>Textile manufacturing in <strong>Lowell, Massachusetts</strong> hired young farm women (<strong>Lowell Girls</strong>). The factory system spread, concentrated in the Northeast.</p><h3>Social Effects</h3><ul><li>A new middle class emerged in Northern cities</li><li>Women\'s roles shifted — middle-class women became focused on home and children ("Cult of Domesticity")</li><li>Immigration increased to meet labor demand</li><li>Southern economy remained agricultural and slave-based, diverging from the North</li></ul><div class="key-concept">The Market Revolution created modern American capitalism, a new middle class, and sharp regional differences between the industrializing North and the slave South.</div>'
            },
            '4.3': {
                id: '4.3', title: 'Jacksonian Democracy and Its Critics',
                content: '<h3>The Age of the Common Man</h3><p><strong>Andrew Jackson</strong> (president 1829-1837) represented a new democratic politics that celebrated ordinary white men and attacked elite privilege.</p><h3>Jacksonian Democracy</h3><ul><li>Expanded suffrage for white men (property requirements dropped in most states)</li><li>Spoils system ("to the victor belong the spoils") — rewarding political supporters with government jobs</li><li>Opposed the Bank of the United States as an elite institution</li><li>Strong presidency; vetoed more bills than all previous presidents combined</li></ul><h3>Indian Removal</h3><p>Jackson forced the <strong>Five Civilized Tribes</strong> (Cherokee, Creek, Choctaw, Chickasaw, Seminole) from their lands. The <strong>Indian Removal Act (1830)</strong> led to the <strong>Trail of Tears (1838-39)</strong> — a forced march in which thousands of Cherokee died.</p><h3>The Whig Opposition</h3><p>The <strong>Whig Party</strong> (Henry Clay, Daniel Webster) opposed Jackson, supporting a strong Congress, national bank, and internal improvements. They championed a "American System" of economic nationalism.</p><h3>Nullification Crisis (1832-33)</h3><p>South Carolina declared federal tariffs null and void. Jackson threatened military force; the crisis was resolved by compromise, but foreshadowed secession.</p><div class="key-concept">Jacksonian Democracy expanded white male democracy but came at the cost of Native American rights and intensified sectional conflict.</div>'
            },
            '4.4': {
                id: '4.4', title: 'Westward Expansion and Manifest Destiny',
                content: '<h3>The Drive West</h3><p>Americans believed it was their God-given right and destiny to expand across the continent.</p><div class="definition"><strong>Manifest Destiny:</strong> The 19th-century belief that the United States was destined by God to expand across North America to the Pacific Ocean.</div><h3>Texas</h3><ul><li>American settlers in Mexican Texas (led by Stephen Austin) rebelled and declared independence (1836)</li><li><strong>Battle of the Alamo</strong> — defenders killed; "Remember the Alamo!" became a rallying cry</li><li>Texas became an independent republic, then was annexed by the U.S. in 1845</li></ul><h3>Oregon</h3><p>Americans settled the Oregon Territory in the 1840s via the Oregon Trail. The slogan "Fifty-four forty or fight!" demanded all of Oregon; Britain and the U.S. compromised at the 49th parallel (1846).</p><h3>Mexican-American War (1846-48)</h3><p>Triggered by the annexation of Texas and a border dispute. Americans won easily; the <strong>Treaty of Guadalupe Hidalgo (1848)</strong> gave the U.S. California, New Mexico, Arizona, Nevada, Utah, and Colorado. Mexico received $15 million.</p><h3>Consequences</h3><p>The new territory reopened the question: would slavery be allowed in the new lands? The <strong>Wilmot Proviso</strong> (1846) proposed banning slavery in the Mexican Cession but was defeated in the Senate.</p><div class="key-concept">Manifest Destiny drove rapid territorial expansion but intensified the crisis over slavery by adding vast new territories whose status had to be decided.</div>'
            },
            '4.5': {
                id: '4.5', title: 'Reform Movements: Abolition, Temperance, Women\'s Rights',
                content: '<h3>The Reform Impulse</h3><p>The 1820s-1850s saw an explosion of reform movements, driven by religious revivals, Enlightenment ideals, and the contradictions between American ideals of liberty and its realities.</p><h3>Abolition</h3><ul><li><strong>William Lloyd Garrison</strong> founded The Liberator (1831) — demanding immediate emancipation</li><li><strong>Frederick Douglass</strong> — escaped slave, brilliant orator, author of his autobiography</li><li><strong>Harriet Tubman</strong> — "conductor" on the Underground Railroad; freed ~300 enslaved people</li><li><strong>Harriet Beecher Stowe</strong> — Uncle Tom\'s Cabin (1852) turned millions against slavery</li></ul><h3>Women\'s Rights</h3><p>The <strong>Seneca Falls Convention (1848)</strong> produced the Declaration of Sentiments — modeled on the Declaration of Independence: "All men and women are created equal." Led by <strong>Elizabeth Cady Stanton</strong> and <strong>Lucretia Mott</strong>. The convention demanded women\'s suffrage and equal rights.</p><h3>Temperance</h3><p>The temperance movement opposed alcohol consumption, linking it to poverty, domestic violence, and moral decline. Led partly by women who suffered from drunken husbands.</p><div class="key-concept">Reform movements challenged Americans to live up to their founding ideals; women reformers gained organizational skills and a political voice through these movements.</div>'
            },
            '4.6': {
                id: '4.6', title: 'The Second Great Awakening',
                content: '<h3>Religious Revival</h3><p>The Second Great Awakening (1800s-1840s) was a Protestant revival movement that swept through American churches and fueled reform.</p><h3>Key Features</h3><ul><li>Emotional, revivalist preaching at camp meetings</li><li><strong>Charles Finney</strong> — leading revivalist, brought revival to cities; emphasized free will and individual choice</li><li>Message: individuals could choose salvation; this democratized religion</li><li>Strong emphasis on social reform as Christian duty</li></ul><h3>Impact on Reform</h3><p>The Awakening provided moral energy for virtually every reform movement:</p><ul><li>Abolitionism — slavery was a sin</li><li>Temperance — drunkenness was a sin</li><li>Prison and asylum reform — <strong>Dorothea Dix</strong> advocated for humane treatment</li><li>Educational reform — <strong>Horace Mann</strong> pushed for public schools</li><li>Utopian communities — Brook Farm, Oneida Community sought perfect societies</li></ul><h3>Burned-Over District</h3><p>Western New York saw such intense religious revivals it was called the "Burned-Over District." It also produced new religious movements like Mormonism (<strong>Joseph Smith</strong>, 1830).</p><div class="key-concept">The Second Great Awakening transformed American religion, emphasizing personal conversion and social responsibility, and drove the great reform movements of the antebellum era.</div>'
            },
            // Unit 5: Period 5 — 1844-1877
            '5.1': {
                id: '5.1', title: 'Sectional Crisis: Slavery and Compromise',
                content: '<h3>The Gathering Storm</h3><p>The expansion of slavery into new territories became the defining political issue of the 1840s and 1850s, as North and South grew increasingly apart.</p><h3>Compromise of 1850</h3><p>California wanted to enter as a free state — upsetting the sectional balance. <strong>Henry Clay</strong>\'s compromise:<ul><li>California admitted as free state</li><li>New Mexico and Utah territories — slavery decided by popular sovereignty</li><li>Stronger Fugitive Slave Act — Northerners required to return escaped slaves</li><li>Slave trade (not slavery) banned in Washington D.C.</li></ul>The Compromise temporarily resolved tensions but angered many on both sides.</p><h3>Kansas-Nebraska Act (1854)</h3><p><strong>Stephen Douglas</strong> proposed organizing Kansas and Nebraska by <strong>popular sovereignty</strong> — letting settlers vote on slavery. This effectively repealed the Missouri Compromise. The result was "Bleeding Kansas" — a mini civil war between pro- and anti-slavery settlers.</p><h3>Dred Scott Decision (1857)</h3><p>The Supreme Court ruled that:<ul><li>Enslaved people were property, not citizens</li><li>Congress had no power to ban slavery in territories</li><li>Missouri Compromise was unconstitutional</li></ul>This outraged Northerners and emboldened Southerners.</p><div class="key-concept">Each attempt to compromise over slavery failed to resolve the fundamental conflict, pushing the nation closer to war.</div>'
            },
            '5.2': {
                id: '5.2', title: 'Road to Civil War: The 1850s',
                content: '<h3>Polarization</h3><p>By the late 1850s, the political system was breaking down along sectional lines.</p><h3>The Republican Party (1854)</h3><p>Founded in opposition to slavery\'s expansion. Drew together Free Soilers, Whigs, and anti-slavery Democrats. <strong>Abraham Lincoln</strong> became their leading voice with his Lincoln-Douglas Debates (1858).</p><h3>John Brown\'s Raid (1859)</h3><p>Radical abolitionist <strong>John Brown</strong> attacked the federal arsenal at Harpers Ferry, Virginia, hoping to spark a slave rebellion. He was captured and executed. Southerners were terrified; Northerners debated whether he was hero or martyr.</p><h3>Election of 1860</h3><p>Lincoln won the presidency without a single Southern electoral vote. South Carolina immediately seceded, followed by six other Deep South states. They formed the <strong>Confederate States of America</strong> and elected <strong>Jefferson Davis</strong> as president.</p><h3>Fort Sumter (April 1861)</h3><p>Confederate forces fired on the federal fort in Charleston Harbor. Lincoln called for 75,000 volunteers. Four more states (including Virginia) seceded. The Civil War had begun.</p><div class="key-concept">The election of a Republican president committed to halting slavery\'s expansion was the final trigger for Southern secession and civil war.</div>'
            },
            '5.3': {
                id: '5.3', title: 'The Civil War: Causes and Course',
                content: '<h3>North vs. South</h3><p>The Civil War (1861-1865) was fought between the Union (North) and the Confederacy (South). The fundamental cause was slavery.</p><h3>Advantages and Disadvantages</h3><p><strong>Union advantages:</strong> Larger population (22 million vs. 9 million, of whom 3.5 million were enslaved), industrial capacity, railroad network, navy<br><strong>Confederate advantages:</strong> Fighting defensively, skilled military leadership (Lee, Jackson), high morale defending their homeland</p><h3>Key Battles and Turning Points</h3><ul><li><strong>Bull Run (1861):</strong> Confederate victory showed the war would not be short</li><li><strong>Antietam (1862):</strong> Bloodiest single day; Lee\'s invasion stopped; gave Lincoln a "victory" to announce Emancipation</li><li><strong>Gettysburg (July 1-3, 1863):</strong> Confederate invasion of Pennsylvania defeated; turning point in the East</li><li><strong>Vicksburg (July 4, 1863):</strong> Union gained control of the Mississippi River, splitting the Confederacy</li><li><strong>Sherman\'s March (1864):</strong> Sherman marched from Atlanta to the sea, destroying Confederate supply lines and civilian morale</li></ul><h3>The End</h3><p>Lee surrendered to Grant at <strong>Appomattox Court House</strong> (April 9, 1865). Lincoln was assassinated five days later.</p><div class="key-concept">The Civil War was the deadliest war in American history (620,000 deaths) — and its outcome preserved the Union and ended slavery.</div>'
            },
            '5.4': {
                id: '5.4', title: 'Lincoln, Emancipation, and War Aims',
                content: '<h3>Lincoln\'s War Aims</h3><p>Lincoln initially insisted the war was fought to preserve the Union, not to free slaves — hoping to keep Border States loyal. He personally opposed slavery but was a political pragmatist.</p><h3>Emancipation Proclamation (January 1, 1863)</h3><p>After Antietam, Lincoln issued the Emancipation Proclamation:<ul><li>Freed enslaved people in Confederate states (not in Union slave states)</li><li>Transformed the war\'s purpose — now explicitly about freedom</li><li>Allowed Black men to serve in the Union Army (180,000 would serve)</li><li>Made European intervention on behalf of the Confederacy politically impossible</li></ul></p><h3>African Americans in the War</h3><p>The <strong>54th Massachusetts Infantry</strong> (famous for the assault on Fort Wagner) proved Black soldiers\' valor. Frederick Douglass urged Black enlistment: "Once let the Black man get upon his person the brass letters U.S., let him get an eagle on his button... and there is no power on earth which can deny that he has earned the right to citizenship."</p><h3>The Gettysburg Address (November 1863)</h3><p>Lincoln redefined the war as a struggle for human equality: "a new birth of freedom" — government "of the people, by the people, for the people."</p><div class="key-concept">The Emancipation Proclamation transformed the Civil War into a struggle for human freedom and made Black military service crucial to Union victory.</div>'
            },
            '5.5': {
                id: '5.5', title: 'Reconstruction: Goals and Implementation',
                content: '<h3>The Challenge</h3><p>After the war, the nation faced enormous questions: How should Southern states be readmitted? What rights would formerly enslaved people have? Who would control Reconstruction — the president or Congress?</p><h3>Presidential vs. Congressional Reconstruction</h3><ul><li><strong>Lincoln\'s plan (10% Plan):</strong> Lenient — 10% of voters take loyalty oath; Radical Republicans thought too easy</li><li><strong>Radical Republican plan (Wade-Davis Bill, 1864):</strong> Harsher requirements; pocket-vetoed by Lincoln</li><li><strong>Johnson\'s Reconstruction:</strong> Even more lenient than Lincoln\'s; allowed ex-Confederates back in power</li></ul><h3>Radical Reconstruction (1867-1877)</h3><p>Congress took over, passing the Reconstruction Acts (1867):</p><ul><li>Southern states divided into military districts</li><li>States must ratify 14th Amendment to be readmitted</li><li><strong>14th Amendment:</strong> Equal protection, due process, defined citizenship</li><li><strong>15th Amendment:</strong> Voting rights regardless of race</li></ul><h3>Freedmen\'s Bureau and Black Political Participation</h3><p>The Freedmen\'s Bureau provided food, education, and legal aid to formerly enslaved people. Black men voted and held office — 16 served in Congress, including two U.S. senators.</p><div class="key-concept">Reconstruction offered a genuine opportunity for Black equality and political participation that was ultimately cut short.</div>'
            },
            '5.6': {
                id: '5.6', title: 'End of Reconstruction and Its Legacy',
                content: '<h3>Why Reconstruction Failed</h3><p>Reconstruction ended through a combination of Southern resistance, Northern fatigue, and a Supreme Court that narrowly interpreted the 14th Amendment.</p><h3>Southern "Redeemers"</h3><p>White Southerners used the <strong>Ku Klux Klan</strong> and other terror groups to intimidate Black voters and Republican politicians. The Enforcement Acts (1870-71) temporarily suppressed the Klan but couldn\'t end white supremacist violence.</p><h3>Compromise of 1877</h3><p>The disputed 1876 election (Hayes vs. Tilden) was resolved: Republicans got the presidency (<strong>Rutherford Hayes</strong>), Democrats got removal of federal troops from the South. Reconstruction was over.</p><h3>Legacy and "Redemption"</h3><ul><li>Southern Democrats ("Redeemers") took power and enacted Black Codes that severely limited Black freedom</li><li>Sharecropping replaced slavery as a system of economic exploitation</li><li><strong>Jim Crow laws</strong> enforced racial segregation</li><li><strong>Plessy v. Ferguson (1896):</strong> Supreme Court upheld "separate but equal"</li></ul><h3>Long-term Impact</h3><p>The 13th, 14th, and 15th Amendments remained in the Constitution and would eventually be used to advance civil rights in the 20th century.</p><div class="key-concept">Reconstruction\'s failure left a legacy of racial injustice that would not be seriously addressed again until the Civil Rights Movement of the 1950s-60s.</div>'
            },
            // Unit 6: Period 6 — 1865-1898
            '6.1': {
                id: '6.1', title: 'Industrialization and the Gilded Age',
                content: '<h3>America\'s Industrial Revolution</h3><p>After the Civil War, the United States became the world\'s leading industrial power. Between 1865 and 1900, industrial output quadrupled.</p><div class="definition"><strong>Gilded Age:</strong> Term coined by Mark Twain for the late 19th century — "gilded" meaning a thin gold coating hiding corruption and inequality beneath.</div><h3>Key Industries</h3><ul><li><strong>Railroads:</strong> The transcontinental railroad (completed 1869) linked the continent; railroads created a national market</li><li><strong>Steel:</strong> Andrew Carnegie pioneered vertical integration</li><li><strong>Oil:</strong> John D. Rockefeller\'s Standard Oil dominated through horizontal integration (trust)</li><li><strong>Finance:</strong> J.P. Morgan consolidated industries through his banking power</li></ul><h3>New Technologies</h3><p><strong>Thomas Edison</strong>\'s inventions (light bulb, 1879; phonograph; electrical grid) transformed daily life. <strong>Alexander Graham Bell</strong> invented the telephone (1876).</p><h3>The Gospel of Wealth</h3><p><strong>Andrew Carnegie</strong>\'s essay argued that the wealthy had a duty to use their riches for public benefit. This justified inequality while encouraging philanthropy.</p><div class="key-concept">The Gilded Age created enormous wealth and technological progress alongside stark inequality, corporate power, and political corruption.</div>'
            },
            '6.2': {
                id: '6.2', title: 'Robber Barons, Trusts, and Big Business',
                content: '<h3>The Rise of Big Business</h3><p>Late 19th-century businessmen used new corporate structures to build unprecedented economic empires.</p><h3>Key Figures</h3><ul><li><strong>John D. Rockefeller:</strong> Standard Oil controlled 90% of oil refining; used trusts to crush competition</li><li><strong>Andrew Carnegie:</strong> Carnegie Steel; "rags to riches" immigrant; vertical integration (controlled all steps from raw materials to finished product)</li><li><strong>J.P. Morgan:</strong> Banker who financed industrial consolidation; created U.S. Steel (first billion-dollar corporation)</li><li><strong>Cornelius Vanderbilt:</strong> Railroads; "law? What do I care about the law? H\'aint I got the power?"</li></ul><h3>Business Tactics</h3><ul><li><strong>Trust:</strong> Multiple companies merging under a board of trustees (Rockefeller\'s model)</li><li><strong>Horizontal integration:</strong> Buying out competitors in the same industry</li><li><strong>Vertical integration:</strong> Controlling all stages of production</li><li>Price fixing, rebates, buying out or destroying competition</li></ul><h3>Government Response</h3><p><strong>Sherman Antitrust Act (1890)</strong> — first federal law against monopolies; initially weakly enforced against businesses (but used against labor unions).</p><div class="key-concept">The robber barons built massive industrial empires through ruthless business tactics, raising questions about corporate power that still resonate today.</div>'
            },
            '6.3': {
                id: '6.3', title: 'Labor Movements and Working Conditions',
                content: '<h3>The Worker\'s Reality</h3><p>Industrial workers in the Gilded Age faced 12-16 hour workdays, dangerous conditions, low wages, child labor, and no protections against injury or unemployment.</p><h3>Major Labor Organizations</h3><ul><li><strong>Knights of Labor (1869):</strong> Open to all workers including women and Black workers; sought 8-hour day; grew to 700,000 members; declined after Haymarket (1886)</li><li><strong>American Federation of Labor (AFL, 1886):</strong> Samuel Gompers led this craft union of skilled workers; focused on "pure and simple" demands — wages, hours, conditions</li></ul><h3>Major Strikes and Conflicts</h3><ul><li><strong>Great Railroad Strike (1877):</strong> First major nationwide strike; crushed by federal troops</li><li><strong>Haymarket Affair (1886):</strong> Chicago bomb explosion at labor rally killed police; blamed on anarchists; damaged labor movement</li><li><strong>Homestead Strike (1892):</strong> Carnegie Steel strikers fought Pinkerton detectives; broken by National Guard</li><li><strong>Pullman Strike (1894):</strong> Eugene Debs led nationwide railroad strike; broken by federal injunction and troops</li></ul><h3>Women Workers</h3><p>Young women, immigrants, and children worked in factories, mines, and sweatshops. The <strong>Triangle Shirtwaist Fire (1911)</strong> killed 146 workers and spurred workplace safety laws.</p><div class="key-concept">Workers organized to resist exploitation, but faced formidable opposition from corporations backed by government, courts, and private armies.</div>'
            },
            '6.4': {
                id: '6.4', title: 'The New South and Jim Crow',
                content: '<h3>After Reconstruction</h3><p>When Reconstruction ended, Southern "Redeemer" Democrats built a new system of racial oppression that would last for nearly a century.</p><h3>Sharecropping and Debt Peonage</h3><p>Most Black Southerners became <strong>sharecroppers</strong> — farming land owned by white landlords and paying rent with a share of the crop. The debt cycle kept them in effective economic bondage.</p><h3>Jim Crow Laws</h3><p>Southern states passed laws mandating racial segregation in every area of public life — schools, transportation, restaurants, water fountains. <strong>Plessy v. Ferguson (1896)</strong> upheld "separate but equal" doctrine.</p><h3>Disenfranchisement</h3><p>Tactics to prevent Black voting: poll taxes, literacy tests, grandfather clauses, white primaries, and terror. By 1900, Black voter registration had collapsed in the South.</p><h3>Responses</h3><ul><li><strong>Booker T. Washington:</strong> Advocated industrial education and economic self-improvement; accepted temporary political inequality (Atlanta Compromise)</li><li><strong>W.E.B. Du Bois:</strong> Demanded full civil rights immediately; co-founded NAACP (1909); criticized Washington\'s accommodationism; called for "Talented Tenth" to lead</li></ul><h3>The New South</h3><p>Henry Grady promoted industrialization in the South, but it remained largely agricultural and poor, dependent on low-wage labor.</p><div class="key-concept">Jim Crow created a system of racial apartheid enforced by law, economic coercion, and terror that defined Southern life until the Civil Rights Movement.</div>'
            },
            '6.5': {
                id: '6.5', title: 'The West: Settlement, Cowboys, and Native Americans',
                content: '<h3>The "Wild West"</h3><p>The trans-Mississippi West underwent dramatic change after the Civil War as settlers, miners, ranchers, and the federal government transformed the region.</p><h3>The Cattle Kingdom</h3><p>After the Civil War, Texas longhorn cattle were driven north on trails (Chisholm Trail) to railheads in Kansas. <strong>Cowboys</strong> — about 1/3 of whom were Black or Mexican — drove massive herds. The cattle kingdom ended by the late 1880s due to overgrazing, harsh winters, and fenced homesteads.</p><h3>Homesteaders</h3><p>The <strong>Homestead Act (1862)</strong> gave 160 acres to settlers who farmed for 5 years. Hundreds of thousands moved to the Great Plains — "sodbusters." Life was difficult: drought, isolation, debt.</p><h3>Native Americans</h3><p>Plains Indians (Sioux, Cheyenne, Apache) were systematically dispossessed:</p><ul><li>Buffalo were slaughtered — over 30 million reduced to hundreds</li><li><strong>Battle of Little Bighorn (1876):</strong> Custer\'s force destroyed by Sioux/Cheyenne under Sitting Bull and Crazy Horse</li><li><strong>Dawes Act (1887):</strong> Broke up tribal lands, gave allotments to individuals — devastating Native land ownership</li><li><strong>Wounded Knee Massacre (1890):</strong> U.S. troops killed ~300 Sioux, including women and children</li></ul><div class="key-concept">Western settlement brought opportunity for white settlers while destroying Native American ways of life through violence, disease, and land dispossession.</div>'
            },
            '6.6': {
                id: '6.6', title: 'American Imperialism and the Spanish-American War',
                content: '<h3>Why Empire?</h3><p>In the 1890s, the U.S. began building an overseas empire, driven by economic interests, racial ideology, strategic competition with European powers, and cultural mission.</p><h3>Ideological Justifications</h3><ul><li><strong>Alfred Thayer Mahan</strong>: The Influence of Sea Power — argued U.S. needed a strong navy and overseas bases</li><li><strong>Josiah Strong</strong>: Anglo-Saxon racial superiority meant duty to spread civilization</li><li><strong>Frederick Jackson Turner\'s Frontier Thesis (1893)</strong>: With the continental frontier closed, America needed new frontiers overseas</li></ul><h3>The Spanish-American War (1898)</h3><p>The explosion of the USS Maine in Havana harbor, sensationalized by "yellow journalism" (Hearst, Pulitzer), led to war with Spain.<ul><li><strong>Cuba</strong>: Won independence (under heavy U.S. influence) from Spain</li><li><strong>Puerto Rico, Guam</strong>: Became U.S. territories</li><li><strong>Philippines</strong>: U.S. purchased for $20 million; Filipino insurrection (1899-1902) killed 200,000+ Filipinos</li></ul></p><h3>Anti-Imperialism</h3><p>The <strong>Anti-Imperialist League</strong> (Mark Twain, Andrew Carnegie) argued empire contradicted American democratic values.</p><div class="key-concept">The Spanish-American War launched the U.S. as an imperial power, raising fundamental questions about democracy, race, and national identity that echo today.</div>'
            },
            // Unit 7: Period 7 — 1890-1945
            '7.1': {
                id: '7.1', title: 'Progressive Era: Reform and Regulation',
                content: '<h3>The Progressive Response</h3><p>The Progressive Era (1890s-1920) was a broad reform movement responding to the problems created by industrialization, urbanization, and corporate power.</p><h3>Progressives\' Goals</h3><ul><li>Regulate big business and break up monopolies</li><li>Clean up political corruption (city bosses, spoils system)</li><li>Improve conditions for workers and the poor</li><li>Use scientific expertise to address social problems</li></ul><h3>Muckrakers</h3><p>Investigative journalists exposed problems: <strong>Upton Sinclair</strong>\'s The Jungle (meatpacking); <strong>Ida Tarbell</strong> (Standard Oil); <strong>Lincoln Steffens</strong> (city corruption).</p><h3>Theodore Roosevelt</h3><p>TR used the presidency as a "bully pulpit" to push reform:<ul><li>Broke up Northern Securities railroad trust (1902)</li><li><strong>Pure Food and Drug Act</strong> and <strong>Meat Inspection Act (1906)</strong></li><li>Conservation — set aside 150 million acres of national forests</li><li>"Square Deal" for workers, consumers, and environment</li></ul></p><h3>Constitutional Amendments</h3><ul><li><strong>16th (1913):</strong> Federal income tax</li><li><strong>17th (1913):</strong> Direct election of senators</li><li><strong>18th (1919):</strong> Prohibition of alcohol</li><li><strong>19th (1920):</strong> Women\'s suffrage</li></ul><div class="key-concept">The Progressive Era established the principle that government should regulate the economy and protect citizens from corporate power — a foundation of modern American government.</div>'
            },
            '7.2': {
                id: '7.2', title: 'World War I and American Involvement',
                content: '<h3>A European War</h3><p>When World War I broke out in Europe in 1914, President Wilson declared American neutrality. Most Americans wanted to stay out.</p><h3>Pressures Toward War</h3><ul><li>German <strong>submarine warfare</strong> threatened neutral ships</li><li><strong>Lusitania sinking (1915):</strong> 1,198 killed, including 128 Americans</li><li><strong>Zimmermann Telegram (1917):</strong> Germany proposed a Mexico-Germany alliance against the U.S.</li><li>Germany resumed unrestricted submarine warfare (1917)</li></ul><h3>American Entry (April 1917)</h3><p>Wilson asked Congress to declare war, saying "the world must be made safe for democracy." <strong>Wilson\'s 14 Points</strong> outlined a peace program: self-determination, freedom of the seas, a League of Nations.</p><h3>The Home Front</h3><ul><li>Selective Service Act — 2.8 million drafted</li><li>Propaganda and patriotic pressure suppressed dissent</li><li><strong>Espionage Act (1917)</strong> and <strong>Sedition Act (1918)</strong> jailed anti-war voices including Eugene Debs</li><li>Great Migration: Black Southerners moved to Northern cities for war jobs</li></ul><h3>The Peace</h3><p><strong>Treaty of Versailles (1919)</strong>: Harsh on Germany; Wilson got the League of Nations but the Senate rejected the treaty. U.S. never joined the League.</p><div class="key-concept">WWI transformed America into a world power but also revealed tensions between democratic ideals and wartime repression, and between internationalism and isolationism.</div>'
            },
            '7.3': {
                id: '7.3', title: 'The Roaring Twenties: Prosperity and Change',
                content: '<h3>Postwar America</h3><p>The 1920s brought economic prosperity, cultural transformation, and sharp social tensions.</p><h3>Economic Boom</h3><ul><li>Mass production — Henry Ford\'s assembly line made cars affordable</li><li>Consumer culture — radios, refrigerators, washing machines</li><li>Advertising and buying on credit became widespread</li><li>Stock market speculation soared</li></ul><h3>Cultural Change</h3><ul><li><strong>Jazz Age:</strong> African American music culture spread nationally</li><li><strong>Flappers:</strong> Young women challenged traditional gender roles</li><li><strong>Harlem Renaissance:</strong> Flowering of Black artistic and intellectual culture (Langston Hughes, Zora Neale Hurston, Louis Armstrong)</li></ul><h3>Social Tensions</h3><ul><li><strong>Prohibition (18th Amendment):</strong> Led to bootlegging and organized crime (Al Capone)</li><li><strong>Red Scare (1919-20):</strong> Fear of communist revolution; Palmer Raids arrested thousands</li><li><strong>Immigration restriction:</strong> Emergency Quota Act (1921), Immigration Act (1924) drastically cut immigration, especially from Southern/Eastern Europe and Asia</li><li><strong>KKK revival:</strong> 4 million members by mid-1920s, now targeting Catholics, Jews, and immigrants as well as Black Americans</li><li><strong>Scopes Trial (1925):</strong> Evolution vs. creationism; modernity vs. tradition</li></ul><div class="key-concept">The 1920s was an era of prosperity and cultural dynamism that also exposed deep divisions over immigration, race, religion, and modernity.</div>'
            },
            '7.4': {
                id: '7.4', title: 'The Great Depression and the New Deal',
                content: '<h3>The Crash</h3><p>The stock market crashed on <strong>Black Tuesday (October 29, 1929)</strong>. The Great Depression that followed was the worst economic crisis in American history.</p><h3>Causes of the Depression</h3><ul><li>Stock market speculation and over-leverage</li><li>Overproduction in agriculture and industry</li><li>Weak banking system — bank failures wiped out savings</li><li>Smoot-Hawley Tariff (1930) made international trade collapse</li><li>Drought in the Great Plains created the <strong>Dust Bowl</strong></li></ul><h3>The Human Toll</h3><p>By 1933: 25% unemployment, banks closed, "Hoovervilles" (shantytowns), families lost farms and homes. Hoover\'s limited response made him deeply unpopular.</p><h3>FDR\'s New Deal</h3><p><strong>Franklin D. Roosevelt</strong> won 1932 in a landslide. His New Deal: "relief, recovery, and reform."</p><ul><li><strong>First Hundred Days (1933):</strong> Bank holiday, FDIC, CCC, AAA, NRA, TVA</li><li><strong>Second New Deal (1935):</strong> Social Security Act, Wagner Act (labor rights), WPA</li></ul><h3>Legacy</h3><p>The New Deal did not end the Depression (WWII did) but permanently expanded federal government\'s role in the economy and created the modern welfare state.</p><div class="key-concept">The Great Depression and New Deal transformed the relationship between government and citizens, establishing social safety nets and federal economic regulation that persist today.</div>'
            },
            '7.5': {
                id: '7.5', title: 'Road to World War II',
                content: '<h3>American Isolationism</h3><p>After WWI, most Americans wanted to stay out of foreign conflicts. Congress passed <strong>Neutrality Acts (1935-37)</strong> banning arms sales to belligerents.</p><h3>Fascism Rises in Europe</h3><ul><li><strong>Mussolini</strong> in Italy (1922); <strong>Hitler</strong> in Germany (1933); <strong>Franco</strong> in Spain (1936)</li><li>Hitler violated the Versailles Treaty — remilitarization, annexation of Austria, Sudetenland</li><li><strong>Munich Agreement (1938):</strong> Britain and France gave Hitler Sudetenland in hopes of avoiding war ("appeasement") — a failure</li></ul><h3>War in Europe and Asia</h3><ul><li>Germany invaded Poland (September 1, 1939); Britain and France declared war</li><li>France fell quickly (1940); Britain fought alone</li><li>Japan invaded China (1937); conquest of Southeast Asia</li></ul><h3>American Drift Toward War</h3><ul><li>FDR used "Cash and Carry," then <strong>Lend-Lease (1941)</strong> to supply Britain</li><li><strong>Atlantic Charter (1941)</strong>: FDR and Churchill\'s joint statement of war aims</li><li><strong>Pearl Harbor (December 7, 1941):</strong> Japanese attack on U.S. naval base in Hawaii; Congress declared war the next day</li></ul><div class="key-concept">American entry into WWII was the direct result of Japanese aggression, though FDR had been moving toward involvement well before Pearl Harbor.</div>'
            },
            '7.6': {
                id: '7.6', title: 'World War II: Home Front and Victory',
                content: '<h3>A Total War</h3><p>WWII required mobilizing American society on an unprecedented scale.</p><h3>The Home Front</h3><ul><li><strong>War Production Board</strong> converted factories to military production; unemployment ended</li><li>Women entered the workforce in huge numbers — "Rosie the Riveter"</li><li><strong>Japanese American internment:</strong> Executive Order 9066 sent 120,000 Japanese Americans to internment camps — one of the great civil liberties violations in American history</li><li>Double V Campaign: Black Americans fought for victory at home and abroad (Victory over fascism AND racism)</li><li>War bonds, rationing, price controls — Americans sacrificed at home</li></ul><h3>Military Strategy</h3><ul><li><strong>Europe First</strong> strategy — Germany was the greater threat</li><li>D-Day (June 6, 1944): Allied invasion of Normandy; beginning of liberation of Western Europe</li><li>Island-hopping campaign in the Pacific</li><li><strong>Manhattan Project:</strong> U.S. developed the atomic bomb</li><li>Atomic bombs dropped on <strong>Hiroshima (Aug. 6)</strong> and <strong>Nagasaki (Aug. 9, 1945)</strong>; Japan surrendered</li></ul><h3>Legacy</h3><p>The war made the U.S. the world\'s dominant military and economic power. The Holocaust intensified support for Jewish homeland (Israel, 1948). The atomic age raised new security dilemmas.</p><div class="key-concept">WWII made the United States a global superpower while revealing tensions between American democratic ideals and racial injustice at home.</div>'
            },
            // Unit 8: Period 8 — 1945-1980
            '8.1': {
                id: '8.1', title: 'Origins and Early Cold War',
                content: '<h3>A New Kind of Conflict</h3><p>After WWII, the U.S. and Soviet Union — former allies — became rivals in a global ideological struggle that would last 45 years.</p><div class="definition"><strong>Cold War:</strong> The state of political and military tension between the U.S. and USSR (1945-1991), characterized by proxy wars, arms race, and ideological competition — but no direct military conflict between the superpowers.</div><h3>Origins</h3><ul><li>Ideological conflict: capitalism vs. communism</li><li>Soviet expansion in Eastern Europe; "Iron Curtain" (Churchill, 1946)</li><li>U.S. feared further Soviet expansion</li></ul><h3>Truman Doctrine and Marshall Plan (1947)</h3><ul><li><strong>Truman Doctrine:</strong> U.S. would support free peoples resisting communist takeover (Greece, Turkey)</li><li><strong>Marshall Plan:</strong> $13 billion to rebuild Western Europe — preventing communist influence</li></ul><h3>Key Early Events</h3><ul><li><strong>Berlin Blockade (1948-49):</strong> Soviet blockade of West Berlin; U.S. airlift for 11 months</li><li><strong>NATO (1949):</strong> Western military alliance formed</li><li><strong>China "falls" to communism (1949):</strong> Mao Zedong wins Chinese Civil War</li><li><strong>Soviet atomic bomb (1949):</strong> U.S. nuclear monopoly ended</li></ul><h3>Containment</h3><p><strong>George Kennan</strong>\'s "Long Telegram" and "X Article" proposed the policy of <strong>containment</strong> — stopping the spread of communism without direct war against the USSR.</p><div class="key-concept">The Truman administration established the framework for Cold War policy — containment, alliances, and economic aid — that shaped American foreign policy for decades.</div>'
            },
            '8.2': {
                id: '8.2', title: 'Korean War, McCarthyism, and the 1950s',
                content: '<h3>The Korean War (1950-1953)</h3><p>When North Korea invaded South Korea (June 1950), Truman ordered U.S. forces under General MacArthur to intervene under UN authorization. It became a "limited war" — ending in an armistice at roughly the original border, with 36,000 Americans killed.</p><h3>McCarthyism and the Red Scare</h3><p>Fear of communist infiltration gripped America:</p><ul><li><strong>HUAC</strong> (House Un-American Activities Committee) investigated Hollywood and government</li><li><strong>Alger Hiss</strong> case and <strong>Rosenberg spy case</strong> heightened fears</li><li><strong>Senator Joseph McCarthy</strong> made reckless accusations of communist infiltration; destroyed careers with no evidence</li><li>Army-McCarthy Hearings (1954): "Have you no sense of decency, sir?" — McCarthy\'s downfall</li></ul><h3>Eisenhower\'s America (1950s)</h3><ul><li>Cold War buildup: "massive retaliation," nuclear deterrence, military-industrial complex</li><li>Highway Act (1956): Interstate highway system transformed America</li><li>Prosperity and conformity: suburban growth (Levittown), baby boom, consumerism</li><li>Television transformed culture</li></ul><h3>The Military-Industrial Complex</h3><p>Eisenhower\'s farewell address (1961) warned about the growing power of defense contractors and the military — a warning many felt went unheeded.</p><div class="key-concept">The early Cold War produced both a global confrontation with communism and a domestic culture of conformity and fear that suppressed dissent.</div>'
            },
            '8.3': {
                id: '8.3', title: 'Civil Rights Movement',
                content: '<h3>The Long Struggle</h3><p>African Americans had been fighting for civil rights since Reconstruction; the post-WWII era created conditions for major breakthroughs.</p><h3>Key Events</h3><ul><li><strong>Brown v. Board of Education (1954):</strong> Supreme Court overturned Plessy — "separate but equal" is inherently unequal. Chief Justice Warren\'s unanimous opinion.</li><li><strong>Montgomery Bus Boycott (1955-56):</strong> Rosa Parks\' arrest sparked a 381-day boycott; introduced <strong>Martin Luther King Jr.</strong> as a leader</li><li><strong>Little Rock Crisis (1957):</strong> Eisenhower sent troops to enforce school integration</li><li><strong>Sit-ins (1960):</strong> Greensboro, NC — students at lunch counters; spread nationally; SNCC founded</li><li><strong>Freedom Riders (1961):</strong> Interracial groups tested desegregation of interstate buses</li><li><strong>March on Washington (1963):</strong> 250,000 people; King\'s "I Have a Dream" speech</li></ul><h3>Legislation</h3><ul><li><strong>Civil Rights Act (1964):</strong> Banned discrimination in public accommodations and employment</li><li><strong>Voting Rights Act (1965):</strong> Protected Black voting rights; directly followed Selma marches (Bloody Sunday)</li></ul><h3>Later Movement</h3><p><strong>Black Power</strong> movement (Stokely Carmichael, Black Panther Party) emerged as more radical alternative, emphasizing Black pride, self-defense, and economic power.</p><div class="key-concept">The Civil Rights Movement used nonviolent direct action to dismantle legal segregation and inspired other social movements of the 1960s.</div>'
            },
            '8.4': {
                id: '8.4', title: 'The 1960s: Great Society and Vietnam',
                content: '<h3>Kennedy and Johnson</h3><p>President <strong>JFK</strong> (1961-63) created the Peace Corps, handled the Cuban Missile Crisis (1962), and began escalating in Vietnam before his assassination (Nov. 22, 1963). <strong>LBJ</strong> built on Kennedy\'s legacy with the most ambitious domestic program since the New Deal.</p><h3>The Great Society</h3><p>Johnson\'s agenda included:</p><ul><li>Civil Rights Act (1964), Voting Rights Act (1965)</li><li><strong>Medicare and Medicaid (1965)</strong> — health insurance for elderly and poor</li><li>Elementary and Secondary Education Act — federal school funding</li><li>Immigration Act (1965) — ended national-origins quotas</li><li>Department of Housing and Urban Development</li></ul><h3>Vietnam</h3><ul><li>U.S. had been supporting South Vietnam since the 1950s</li><li><strong>Gulf of Tonkin Resolution (1964)</strong>: Congress gave LBJ authority to escalate — based on disputed incident</li><li>By 1968: 500,000 U.S. troops; 58,000 Americans would die</li><li><strong>Tet Offensive (1968)</strong>: Massive NVA attack shocked Americans; turned public opinion against war</li><li>LBJ decided not to seek re-election; RFK and MLK assassinated (1968)</li><li>Nixon promised "peace with honor" but war lasted until 1975</li><li><strong>War Powers Act (1973)</strong>: Limited president\'s ability to commit troops without Congress</li></ul><div class="key-concept">The 1960s saw ambitious domestic reforms alongside a catastrophic war that divided the nation and damaged public trust in government.</div>'
            },
            '8.5': {
                id: '8.5', title: 'Social Movements: Women\'s Rights, Environment, Identity',
                content: '<h3>A Decade of Movements</h3><p>The Civil Rights Movement inspired other groups to demand their rights through collective action.</p><h3>Women\'s Rights</h3><ul><li><strong>Betty Friedan</strong>\'s The Feminine Mystique (1963) identified the "problem that has no name" — middle-class women\'s dissatisfaction with limited domestic roles</li><li><strong>NOW (National Organization for Women, 1966)</strong> demanded equal opportunity</li><li>Women\'s Liberation Movement pushed for reproductive rights, equal pay, ending gender discrimination</li><li><strong>Roe v. Wade (1973):</strong> Supreme Court recognized constitutional right to abortion (overturned in 2022)</li><li><strong>ERA (Equal Rights Amendment)</strong>: Passed Congress (1972) but never ratified by states</li></ul><h3>Environmental Movement</h3><ul><li><strong>Rachel Carson</strong>\'s Silent Spring (1962) exposed pesticide dangers</li><li>First <strong>Earth Day (1970)</strong>; 20 million participants</li><li>EPA (Environmental Protection Agency) created (1970)</li><li>Clean Air Act, Clean Water Act, Endangered Species Act</li></ul><h3>Other Movements</h3><ul><li><strong>Chicano Movement</strong>: Cesar Chavez and UFW fought for farmworkers\' rights</li><li><strong>American Indian Movement (AIM)</strong>: Red Power; Wounded Knee occupation (1973)</li><li><strong>Gay Rights</strong>: Stonewall Riot (1969) launched modern LGBTQ rights movement</li></ul><div class="key-concept">The 1960s-70s produced a broad expansion of rights for women, minorities, and the environment that permanently transformed American law and culture.</div>'
            },
            '8.6': {
                id: '8.6', title: 'Nixon, Watergate, and the 1970s',
                content: '<h3>Nixon\'s Presidency</h3><p>Richard Nixon (1969-74) pursued a complex agenda: ending Vietnam, opening China, detente with the Soviets — and paranoid domestic politics that led to his downfall.</p><h3>Nixon\'s Foreign Policy</h3><ul><li><strong>Detente:</strong> Easing tensions with USSR and China; SALT I arms control treaty</li><li><strong>Opening to China (1972):</strong> Nixon visited Beijing; began normalization</li><li><strong>Vietnamization:</strong> Gradually transferring fighting to South Vietnam while withdrawing U.S. troops</li><li>Paris Peace Accords (1973): Ceasefire; U.S. withdrew; South Vietnam fell in 1975</li></ul><h3>Watergate</h3><p>Nixon\'s operatives broke into Democratic headquarters at the Watergate hotel (1972). Nixon covered up the break-in. When <strong>White House tapes</strong> revealed his role, he faced certain impeachment and resigned August 9, 1974 — the only president to resign.</p><h3>The Troubled 1970s</h3><ul><li><strong>OPEC oil embargo (1973):</strong> Gas shortages; stagflation (inflation + recession)</li><li>Ford\'s pardon of Nixon outraged the public</li><li>Carter administration struggled with Iran hostage crisis and energy crisis</li><li>Malaise and loss of confidence in government — legacy of Vietnam and Watergate</li></ul><div class="key-concept">Watergate and Vietnam destroyed public trust in government; the 1970s stagflation crisis set the stage for Reagan\'s conservative revolution.</div>'
            },
            // Unit 9: Period 9 — 1980-Present
            '9.1': {
                id: '9.1', title: 'Reagan Revolution and New Conservatism',
                content: '<h3>The Conservative Backlash</h3><p>Ronald Reagan\'s 1980 landslide represented a major political realignment, as Americans turned away from the liberal consensus of the New Deal and Great Society.</p><h3>The Conservative Coalition</h3><ul><li>Economic conservatives: wanted lower taxes, less regulation, smaller government</li><li>Social conservatives (Religious Right): opposed abortion, supported school prayer, traditional values</li><li>Anti-communists: wanted aggressive stance against the Soviet Union</li><li><strong>Sun Belt</strong> growth shifted political power to more conservative regions</li></ul><h3>Reaganomics</h3><p>"Supply-side economics" (trickle-down theory):</p><ul><li>Major tax cuts — top rate from 70% to 28%</li><li>Deregulation of industries</li><li>Cuts to social programs</li><li>Increased military spending</li><li>Federal deficit tripled under Reagan</li></ul><h3>Social Policies</h3><ul><li>Appointed conservative Supreme Court justices</li><li>Opposed affirmative action</li><li>War on Drugs — harsh sentencing, mass incarceration</li><li>AIDS crisis (1980s) — initially slow government response</li></ul><h3>"Morning in America"</h3><p>Reagan\'s optimistic rhetoric restored national confidence after the malaise of the 1970s. He was reelected by a landslide in 1984.</p><div class="key-concept">The Reagan Revolution reshaped American politics for a generation, making anti-government, free-market conservatism the dominant political philosophy.</div>'
            },
            '9.2': {
                id: '9.2', title: 'End of the Cold War',
                content: '<h3>Reagan\'s Cold War Strategy</h3><p>Reagan dramatically escalated military spending and confrontation with the USSR, calling it the "Evil Empire."</p><h3>SDI and Military Buildup</h3><ul><li><strong>Strategic Defense Initiative ("Star Wars"):</strong> Proposed missile defense shield; technologically dubious but put pressure on the Soviets</li><li>Reagan Doctrine: U.S. supported anti-communist insurgencies worldwide (Afghanistan, Nicaragua, Angola)</li><li><strong>Iran-Contra Affair:</strong> Administration secretly sold weapons to Iran and used proceeds to fund Nicaraguan Contras — illegal and damaged Reagan\'s reputation</li></ul><h3>Gorbachev and Reform</h3><p><strong>Mikhail Gorbachev</strong> introduced:<ul><li><strong>Glasnost</strong> (openness) — free press, political freedom</li><li><strong>Perestroika</strong> (restructuring) — economic reforms</li></ul>These reforms unleashed forces that undermined Soviet control.</p><h3>The Fall of the Wall</h3><ul><li>1989: Eastern European revolutions toppled communist governments</li><li><strong>Berlin Wall fell (November 9, 1989)</strong></li><li>German reunification (1990)</li><li>USSR dissolved (December 25, 1991) — 15 independent republics</li></ul><h3>The Gulf War (1991)</h3><p>Iraq invaded Kuwait; President George H.W. Bush assembled a 34-nation coalition that quickly expelled Iraq in Operation Desert Storm.</p><div class="key-concept">The Cold War ended not through military conflict but through the internal collapse of the Soviet system under the weight of its own contradictions and Gorbachev\'s reforms.</div>'
            },
            '9.3': {
                id: '9.3', title: 'Culture Wars and Social Change in the 1990s',
                content: '<h3>Clinton and the Third Way</h3><p>Bill Clinton won in 1992 with "It\'s the economy, stupid!" He triangulated between liberal and conservative positions, moving the Democratic Party to the center.</p><h3>Culture Wars</h3><p>America was divided by contentious debates over values:</p><ul><li>Abortion rights vs. pro-life movement</li><li>Affirmative action debates</li><li>LGBTQ rights (Don\'t Ask Don\'t Tell; Defense of Marriage Act)</li><li>Immigration debates</li><li>Multiculturalism in schools and universities</li><li>Rising Christian conservative political activism</li></ul><h3>Clinton\'s Presidency</h3><ul><li>NAFTA (1994) — free trade with Mexico and Canada</li><li>Welfare reform (1996) — "end welfare as we know it"</li><li>Budget surplus by late 1990s (first since 1969)</li><li><strong>Impeachment (1998):</strong> House impeached Clinton over Monica Lewinsky affair; Senate acquitted</li></ul><h3>The New Right</h3><p>Republicans took the House in 1994 (Newt Gingrich\'s "Contract with America") for the first time in 40 years. The culture wars intensified throughout the decade.</p><div class="key-concept">The 1990s prosperity masked deep social divisions that would become increasingly polarizing in the 21st century.</div>'
            },
            '9.4': {
                id: '9.4', title: 'Globalization and the New Economy',
                content: '<h3>The Digital Revolution</h3><p>The 1990s-2000s saw the Internet transform the economy, culture, and daily life.</p><h3>The Tech Boom</h3><ul><li>World Wide Web (1991) made the internet accessible to the public</li><li>Dot-com boom (1995-2000) created massive wealth — and a bubble</li><li>Amazon (1994), Google (1998), Apple\'s resurgence</li><li>Dot-com bust (2000-01) wiped out trillions in paper wealth</li></ul><h3>NAFTA and Globalization</h3><ul><li><strong>NAFTA (1994)</strong>: Eliminated trade barriers between U.S., Mexico, Canada</li><li>WTO (1995): Global free trade framework</li><li>Manufacturing jobs moved overseas as companies sought cheaper labor</li><li>Deindustrialization of the "Rust Belt"</li><li>Income inequality grew — gains went disproportionately to the wealthy</li></ul><h3>Financial Crisis (2008)</h3><p>Deregulation of financial industry + subprime mortgage crisis + complex financial instruments created a global financial collapse. Bush and Obama used massive government intervention (TARP) to prevent another Great Depression. Unemployment reached 10%; millions lost homes.</p><h3>The Gig Economy</h3><p>New forms of work emerged — temporary, flexible, contractor-based — with less job security and benefits.</p><div class="key-concept">Globalization and the digital revolution created enormous new wealth while exacerbating inequality and hollowing out middle-class manufacturing jobs.</div>'
            },
            '9.5': {
                id: '9.5', title: '9/11 and the War on Terror',
                content: '<h3>September 11, 2001</h3><p>Al-Qaeda terrorists hijacked four planes, crashing two into the World Trade Center, one into the Pentagon, and one into a Pennsylvania field. Nearly 3,000 people died in the deadliest attack on American soil since Pearl Harbor.</p><h3>The Immediate Response</h3><ul><li>Congress passed the <strong>PATRIOT Act</strong> — expanded government surveillance powers</li><li><strong>Department of Homeland Security</strong> created</li><li>War in <strong>Afghanistan (2001)</strong>: Invaded to destroy Al-Qaeda and remove Taliban; became America\'s longest war</li></ul><h3>Iraq War (2003)</h3><p>Bush administration argued Iraq had weapons of mass destruction (WMD) and links to Al-Qaeda — both proved false. U.S. invaded, quickly toppled Saddam Hussein, but faced years of insurgency.</p><ul><li>Abu Ghraib prisoner abuse scandal damaged U.S. reputation</li><li>No WMD found; credibility of government badly damaged</li><li>U.S. combat mission ended 2011; ISIS emerged from chaos</li></ul><h3>Obama and Counter-Terrorism</h3><ul><li>Osama bin Laden killed by Navy SEALs (May 2, 2011)</li><li>Expanded drone warfare</li><li>Withdrew from Iraq; escalated in Afghanistan</li></ul><h3>Domestic Impact</h3><p>Increased surveillance, Islamophobia, debates over civil liberties vs. security, hyper-partisanship.</p><div class="key-concept">9/11 transformed American foreign and domestic policy, launching two wars and an era of heightened security that changed civil liberties and global relationships.</div>'
            },
            '9.6': {
                id: '9.6', title: '21st Century Challenges and Continuities',
                content: '<h3>Political Polarization</h3><p>American politics became increasingly polarized along partisan, racial, cultural, and geographic lines in the 21st century.</p><h3>Obama\'s Presidency (2009-2017)</h3><ul><li>First African American president — historic milestone</li><li><strong>Affordable Care Act (ACA, 2010)</strong>: Major expansion of health insurance coverage</li><li>Economic recovery from 2008 financial crisis</li><li>Tea Party movement rose in opposition — forerunner of Trumpism</li><li>Polarization intensified through social media</li></ul><h3>Trump and Its Aftermath (2017-2021)</h3><ul><li>Donald Trump\'s election reflected populist, nationalist backlash against globalization and immigration</li><li>Impeached twice (2019, 2021)</li><li>January 6, 2021: Capitol attack after election loss</li></ul><h3>Ongoing Challenges</h3><ul><li><strong>Racial justice:</strong> Black Lives Matter movement following police killings; continued reckoning with structural racism</li><li><strong>Climate change:</strong> Growing scientific consensus; political divisions over policy</li><li><strong>Income inequality:</strong> Growing gap between wealthy and working class</li><li><strong>Immigration:</strong> Debates over borders, DACA, undocumented immigrants</li><li><strong>COVID-19 pandemic (2020):</strong> Over 1 million American deaths; revealed systemic health inequities</li></ul><div class="key-concept">The 21st century United States faces challenges that are rooted in longstanding tensions in American history — over democracy, equality, identity, and America\'s role in the world.</div>'
            }
        };

        function getLesson(topicId) { return lessons[topicId] || { id: topicId, title: 'Topic ' + topicId, content: '<p>Content coming soon.</p>' }; }
        function getAllLessons() { return lessons; }

        return { getLesson, getAllLessons };
    })();

    // ============================================
    // PUZZLES MODULE - AP US History
    // ============================================
    const Puzzles = (function() {
        const puzzles = [
            // ===== UNIT 1: Period 1, 1491-1607 =====
            // Topic 1.1
            { topic: '1.1', type: 'multiple_choice', stem: 'Native American societies before European contact were:', choices: ['Primitive and unorganized', 'Diverse and complex civilizations', 'Mostly nomadic', 'United under one government'], correct: 1, explanation: 'Native Americans built hundreds of distinct cultures, political systems, and economies across the continent.' },
            { topic: '1.1', type: 'multiple_choice', stem: 'The Iroquois Confederacy was notable for:', choices: ['Its vast trading empire', 'Its political alliance of five nations', 'Its pyramid-building', 'Its ocean-going ships'], correct: 1, explanation: 'The Iroquois (Haudenosaunee) Confederacy united five (later six) nations in a sophisticated political alliance.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Iroquois_5_Nation_Map_c1650.png/640px-Iroquois_5_Nation_Map_c1650.png', caption: 'Iroquois Five Nations territory, c. 1650 (public domain)' } },
            { topic: '1.1', type: 'multiple_choice', stem: 'Pueblo peoples of the Southwest were known for:', choices: ['Buffalo hunting on horseback', 'Large ocean-going canoes', 'Agriculture, irrigation, and cliff dwellings', 'Nomadic lifestyle'], correct: 2, explanation: 'Pueblo peoples like the Hopi and Zuni practiced agriculture with irrigation and built multi-story cliff dwellings.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/USA_09969_Cliff_Palace_Luca_Galuzzi_2007.jpg/640px-USA_09969_Cliff_Palace_Luca_Galuzzi_2007.jpg', caption: 'Cliff Palace, Mesa Verde, Colorado (public domain)' } },
            { topic: '1.1', type: 'multiple_choice', stem: 'Most Native American kinship systems were:', choices: ['Patrilineal only', 'Based on wealth', 'Often matrilineal (descent through the mother)', 'Purely individual'], correct: 2, explanation: 'Many Native societies traced descent through the mother\'s line, giving women significant social status.' },

            // Topic 1.2
            { topic: '1.2', type: 'multiple_choice', stem: 'The "Three Gs" that motivated European exploration were:', choices: ['Gold, Guns, Government', 'Gold, Glory, God', 'Geography, Gain, Glory', 'Growth, Greed, God'], correct: 1, explanation: 'European explorers were driven by the desire for Gold (wealth), Glory (fame), and God (spreading Christianity).' },
            { topic: '1.2', type: 'multiple_choice', stem: 'Portugal led early European exploration because of:', choices: ['Its large army', 'Prince Henry the Navigator\'s sponsorship and new ship technology', 'Its close location to the Americas', 'Papal support only'], correct: 1, explanation: 'Portugal developed the caravel, navigation instruments, and Prince Henry sponsored African coastal exploration.' },
            { topic: '1.2', type: 'multiple_choice', stem: 'Vasco da Gama\'s 1498 voyage was significant because he:', choices: ['Discovered America', 'Found a sea route to India around Africa', 'Circumnavigated the globe', 'Mapped the Caribbean'], correct: 1, explanation: 'Da Gama reached India by sailing around Africa, opening direct European sea trade with Asia.' },
            { topic: '1.2', type: 'multiple_choice', stem: 'Columbus sailed west believing he would reach:', choices: ['A new continent', 'Asia (the Indies)', 'Africa', 'The North Pole'], correct: 1, explanation: 'Columbus believed he had found islands off the coast of Asia; he died never knowing he had found continents unknown to Europeans.' },

            // Topic 1.3
            { topic: '1.3', type: 'multiple_choice', stem: 'Hernan Cortes conquered the Aztec Empire aided by:', choices: ['Superior numbers alone', 'Disease, Native allies, and superior weapons', 'British military support', 'Aztec surrender without fighting'], correct: 1, explanation: 'Cortes combined smallpox (which devastated the Aztecs), alliances with Aztec enemies, steel armor, horses, and firearms.' },
            { topic: '1.3', type: 'multiple_choice', stem: 'The most important factor in European conquest of Native Americans was:', choices: ['Better military tactics', 'Superior weapons', 'European diseases to which Natives had no immunity', 'Larger armies'], correct: 2, explanation: 'Diseases like smallpox killed 50-90% of indigenous populations, making military conquest far easier.' },
            { topic: '1.3', type: 'multiple_choice', stem: 'Francisco Pizarro conquered the:', choices: ['Aztec Empire', 'Inca Empire', 'Maya Empire', 'Cherokee Nation'], correct: 1, explanation: 'Pizarro conquered the Inca Empire in Peru (1532-35) using tactics similar to Cortes in Mexico.' },
            { topic: '1.3', type: 'multiple_choice', stem: 'The Aztec leader who encountered Cortes was:', choices: ['Atahualpa', 'Pocahontas', 'Montezuma II', 'Metacom'], correct: 2, explanation: 'Montezuma II led the Aztec Empire when Cortes arrived and was killed during the Spanish conquest.' },

            // Topic 1.4
            { topic: '1.4', type: 'multiple_choice', stem: 'The encomienda system was:', choices: ['A fair wage system for Native workers', 'A system of forced Native labor granted to Spanish colonists', 'A land grant to Native peoples', 'A religious conversion program only'], correct: 1, explanation: 'The encomienda granted Spanish colonists authority over Native workers, who were forced to labor — essentially enslavement.' },
            { topic: '1.4', type: 'multiple_choice', stem: 'Bartolome de las Casas is remembered for:', choices: ['Conquering the Aztecs', 'Documenting and condemning Spanish cruelty against Native peoples', 'Founding New Spain', 'Mapping the Gulf of Mexico'], correct: 1, explanation: 'Las Casas, a Dominican friar, witnessed and recorded Spanish atrocities and advocated for Native rights.' },
            { topic: '1.4', type: 'multiple_choice', stem: 'In the Spanish colonial caste system, the highest social rank was held by:', choices: ['Criollos', 'Mestizos', 'Peninsulares', 'Indios'], correct: 2, explanation: 'Peninsulares — people born in Spain — held the highest social and political positions in Spanish colonies.' },
            { topic: '1.4', type: 'multiple_choice', stem: 'Spanish missionaries established missions in order to:', choices: ['Build military bases', 'Convert Native peoples to Christianity and use their labor', 'Create democratic governments', 'Trade in gold'], correct: 1, explanation: 'Franciscan and Jesuit missions served both religious conversion and as economic enterprises using Native labor.' },

            // Topic 1.5
            { topic: '1.5', type: 'multiple_choice', stem: 'France\'s colonial strategy in North America focused primarily on:', choices: ['Agricultural settlement', 'Fur trade with Native Americans', 'Gold mining', 'Plantation agriculture'], correct: 1, explanation: 'France established a lucrative fur trade, often living among and marrying into Native communities.' },
            { topic: '1.5', type: 'multiple_choice', stem: 'Samuel de Champlain founded:', choices: ['Montreal', 'Quebec', 'New Orleans', 'Jamestown'], correct: 1, explanation: 'Champlain founded Quebec in 1608, the heart of New France.' },
            { topic: '1.5', type: 'multiple_choice', stem: 'Henry Hudson explored the Hudson River for:', choices: ['England', 'Spain', 'France', 'The Netherlands'], correct: 3, explanation: 'Hudson sailed for the Dutch East India Company in 1609, leading to the Dutch colony of New Netherland (later New York).' },
            { topic: '1.5', type: 'multiple_choice', stem: 'England\'s Roanoke Colony (1585) is known as the:', choices: ['First successful colony', 'Lost Colony — it mysteriously disappeared', 'First slave colony', 'Puritan colony'], correct: 1, explanation: 'The Roanoke Colony vanished with no clear explanation; when resupply ships arrived in 1590, settlers were gone.' },

            // Topic 1.6
            { topic: '1.6', type: 'multiple_choice', stem: 'The Columbian Exchange refers to:', choices: ['Trade between Spanish colonies', 'The transfer of plants, animals, and diseases between the Eastern and Western Hemispheres', 'Columbus\'s trade routes', 'Exchange of gold for silver'], correct: 1, explanation: 'The Columbian Exchange permanently connected the ecosystems of the Old and New Worlds after 1492.' },
            { topic: '1.6', type: 'multiple_choice', stem: 'Which crop from the Americas most helped increase European population?', choices: ['Rice', 'Wheat', 'Potato', 'Coffee'], correct: 2, explanation: 'The potato provided cheap, nutritious calories and helped fuel European population growth.' },
            { topic: '1.6', type: 'multiple_choice', stem: 'European diseases devastated Native American populations because:', choices: ['Native people were physically weak', 'They had no prior exposure and lacked immunity', 'They refused medicine', 'The diseases came from water'], correct: 1, explanation: 'Diseases like smallpox were completely new to the Americas; Native peoples had no immunity and died in catastrophic numbers.' },
            { topic: '1.6', type: 'multiple_choice', stem: 'Which animal, introduced by Europeans, most transformed Great Plains Native American cultures?', choices: ['Cattle', 'Pigs', 'Horses', 'Sheep'], correct: 2, explanation: 'Horses transformed the Plains peoples into highly mobile buffalo hunters, reshaping their entire way of life.' },

            // ===== UNIT 2: Period 2, 1607-1754 =====
            // Topic 2.1
            { topic: '2.1', type: 'multiple_choice', stem: 'Jamestown (1607) was founded by:', choices: ['Puritans seeking religious freedom', 'The Virginia Company seeking profit', 'Catholics fleeing persecution', 'The Dutch West India Company'], correct: 1, explanation: 'Jamestown was a commercial venture of the Virginia Company, seeking gold and trade profits.' },
            { topic: '2.1', type: 'multiple_choice', stem: 'What crop saved the Virginia colony economically?', choices: ['Cotton', 'Tobacco', 'Rice', 'Corn'], correct: 1, explanation: 'John Rolfe developed a marketable tobacco strain in 1612; Virginia\'s economy became dependent on it.' },
            { topic: '2.1', type: 'multiple_choice', stem: 'Bacon\'s Rebellion (1676) pushed Virginia planters to prefer:', choices: ['Free white labor', 'Indentured servants only', 'Enslaved African labor as more controllable', 'Native American workers'], correct: 2, explanation: 'The rebellion by poor white freedmen alarmed planters, who shifted to enslaved Africans — seen as more controllable.' },
            { topic: '2.1', type: 'multiple_choice', stem: 'Maryland was founded as a refuge for:', choices: ['Puritans', 'Quakers', 'Catholics', 'Debtors'], correct: 2, explanation: 'Lord Baltimore founded Maryland in 1634 as a haven for English Catholics.' },

            // Topic 2.2
            { topic: '2.2', type: 'multiple_choice', stem: 'The Mayflower Compact (1620) established:', choices: ['The Church of England in America', 'Self-government by consent among the Pilgrim settlers', 'A military alliance with Native peoples', 'Trade regulations with England'], correct: 1, explanation: 'The Mayflower Compact created a framework for self-government among the Pilgrims before landing.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Mayflower_in_Plymouth_Harbor%2C_by_William_Halsall.jpg/640px-Mayflower_in_Plymouth_Harbor%2C_by_William_Halsall.jpg', caption: 'Mayflower in Plymouth Harbor by William Halsall, 1882 (public domain)' } },
            { topic: '2.2', type: 'multiple_choice', stem: 'John Winthrop described Massachusetts Bay Colony as:', choices: ['A land of economic opportunity', '"A City upon a Hill" — a model Christian community', 'A military outpost', 'A trading post'], correct: 1, explanation: 'Winthrop\'s sermon called on colonists to create a perfect Puritan community that would be an example to the world.' },
            { topic: '2.2', type: 'multiple_choice', stem: 'Roger Williams was banished from Massachusetts Bay because he:', choices: ['Refused to pay taxes', 'Challenged Puritan authority and advocated separation of church and state', 'Supported the king', 'Led an armed rebellion'], correct: 1, explanation: 'Williams believed the civil government had no authority over religious matters; he founded Rhode Island after banishment.' },
            { topic: '2.2', type: 'multiple_choice', stem: 'The Great Awakening of the 1730s-40s emphasized:', choices: ['Reason over emotion in religion', 'Personal conversion and emotional religious experience', 'Rejection of Christianity', 'Political independence'], correct: 1, explanation: 'The Great Awakening was a revivalist movement emphasizing direct personal relationship with God over formal religious practice.' },

            // Topic 2.3
            { topic: '2.3', type: 'multiple_choice', stem: 'Pennsylvania was founded by William Penn as a:', choices: ['Military colony', '"Holy experiment" with religious tolerance', 'Tobacco plantation colony', 'Puritan community'], correct: 1, explanation: 'Quaker William Penn created Pennsylvania as a refuge of religious freedom and tried to deal fairly with Native peoples.' },
            { topic: '2.3', type: 'multiple_choice', stem: 'The Middle Colonies were distinctive for their:', choices: ['Large slave plantations', 'Ethnic and religious diversity', 'Puritan religious uniformity', 'Lack of trade'], correct: 1, explanation: 'New York, Pennsylvania, New Jersey, and Delaware attracted many nationalities and religions, becoming the most diverse colonies.' },
            { topic: '2.3', type: 'multiple_choice', stem: 'Georgia was founded partly as a buffer between English Carolina and:', choices: ['France in Louisiana', 'Spain in Florida', 'Native confederacies', 'Dutch New York'], correct: 1, explanation: 'Georgia (1733) was founded to protect the Carolinas from Spanish Florida.' },

            // Topic 2.4
            { topic: '2.4', type: 'multiple_choice', stem: 'Mercantilism held that colonies should:', choices: ['Develop independently', 'Provide raw materials and buy English manufactured goods', 'Trade freely with all nations', 'Govern themselves'], correct: 1, explanation: 'England\'s Navigation Acts required colonial trade to enrich England by providing resources and buying English goods.' },
            { topic: '2.4', type: 'multiple_choice', stem: 'Benjamin Franklin best represented which intellectual movement in colonial America?', choices: ['Puritanism', 'The Great Awakening', 'The Enlightenment', 'Romanticism'], correct: 2, explanation: 'Franklin embodied Enlightenment values of reason, science, self-improvement, and practical wisdom.' },
            { topic: '2.4', type: 'multiple_choice', stem: 'The Navigation Acts required colonial trade to:', choices: ['Go through English ships and ports', 'Be taxed only at colonial level', 'Be shared with Spain', 'Avoid slavery'], correct: 0, explanation: 'Navigation Acts required colonial goods to be shipped on English vessels through English ports, benefiting English merchants.' },

            // Topic 2.5
            { topic: '2.5', type: 'multiple_choice', stem: 'The Middle Passage refers to:', choices: ['A trade route through the Rocky Mountains', 'The transatlantic voyage of enslaved Africans', 'A Native American migration path', 'A route connecting Northern colonies'], correct: 1, explanation: 'The Middle Passage was the brutal ocean crossing during which enslaved Africans were transported to the Americas.' },
            { topic: '2.5', type: 'multiple_choice', stem: 'Slavery became legally defined as lifelong and hereditary in the Chesapeake during the:', choices: ['1620s', '1640s-1660s', '1700s', '1750s'], correct: 1, explanation: 'Virginia passed laws in the 1640s-1660s establishing slavery as a permanent, inherited status based on race.' },
            { topic: '2.5', type: 'multiple_choice', stem: 'The Stono Rebellion (1739) was significant as:', choices: ['The first colonial battle against Britain', 'One of the largest slave revolts in colonial America', 'A Native American uprising', 'A religious revolt'], correct: 1, explanation: 'The Stono Rebellion in South Carolina was a major enslaved people\'s uprising that led to harsher slave codes.' },
            { topic: '2.5', type: 'multiple_choice', stem: 'Enslaved people in the colonial period resisted bondage through:', choices: ['Open military revolt only', 'Slow work, sabotage, flight, and occasional uprisings', 'Legal challenges only', 'They did not resist'], correct: 1, explanation: 'Resistance took many forms — both everyday acts of defiance and organized revolts.' },

            // Topic 2.6
            { topic: '2.6', type: 'multiple_choice', stem: 'King Philip\'s War (1675-76) was fought between:', choices: ['England and France', 'English colonists and Native Americans led by Metacom', 'Colonists and the British army', 'Northern and southern colonies'], correct: 1, explanation: 'Metacom (King Philip), a Wampanoag leader, led a coalition of tribes against New England colonists in this devastating war.' },
            { topic: '2.6', type: 'multiple_choice', stem: 'The Pueblo Revolt (1680) was significant because:', choices: ['Colonists defeated the Pueblo people', 'The Pueblo drove the Spanish from New Mexico for 12 years', 'It began the French and Indian War', 'It led to American independence'], correct: 1, explanation: 'The Pueblo Revolt was the most successful Native uprising against Europeans — Spanish were expelled from New Mexico for 12 years.' },
            { topic: '2.6', type: 'multiple_choice', stem: 'The Iroquois Confederacy maintained power by:', choices: ['Allied with one European power exclusively', 'Playing European powers against each other', 'Avoiding all contact with Europeans', 'Joining English colonial governments'], correct: 1, explanation: 'The Iroquois skillfully played France, England, and the Dutch against each other to maintain sovereignty and trade advantages.' },

            // ===== UNIT 3: Period 3, 1754-1800 =====
            // Topic 3.1
            { topic: '3.1', type: 'multiple_choice', stem: 'The French and Indian War (1754-1763) was a conflict between:', choices: ['France and Native Americans', 'Britain and France, with most Native Americans siding with France', 'England and its colonies', 'France and Spain'], correct: 1, explanation: 'Most Native Americans allied with France, which had better trade relationships and fewer land-hungry settlers.' },
            { topic: '3.1', type: 'multiple_choice', stem: 'The Proclamation of 1763 forbade colonists from:', choices: ['Trading with France', 'Settling west of the Appalachian Mountains', 'Voting in colonial elections', 'Raising their own militias'], correct: 1, explanation: 'Britain issued the Proclamation to avoid costly wars with Native Americans, but colonists resented the restriction.' },
            { topic: '3.1', type: 'multiple_choice', stem: 'Britain needed to tax the colonies after the French and Indian War in order to:', choices: ['Pay for a new royal palace', 'Pay off the massive war debt', 'Fund schools in England', 'Build a colonial navy'], correct: 1, explanation: 'The war left Britain deeply in debt; Parliament believed colonists should help pay for the war fought partly on their behalf.' },
            { topic: '3.1', type: 'multiple_choice', stem: 'A young George Washington\'s military expedition in 1754 led to:', choices: ['The founding of Virginia', 'The start of the French and Indian War', 'American independence', 'The Treaty of Paris of 1763'], correct: 1, explanation: 'Washington\'s skirmish in the Ohio Valley triggered the broader conflict between Britain and France.' },

            // Topic 3.2
            { topic: '3.2', type: 'multiple_choice', stem: 'The slogan "No taxation without representation" expressed the colonial argument that:', choices: ['Taxes are always wrong', 'Only Parliament could tax', 'Colonists should not be taxed by a legislature in which they had no representatives', 'All British taxes were illegal'], correct: 2, explanation: 'Colonists argued that English constitutional tradition required the consent of the taxed through their elected representatives.' },
            { topic: '3.2', type: 'multiple_choice', stem: 'The Boston Tea Party (1773) was a protest against:', choices: ['British troops in Boston', 'The Tea Act, which gave a monopoly to the East India Company', 'The Stamp Act', 'The Quartering Act'], correct: 1, explanation: 'The Tea Act made British tea cheaper than smuggled tea but gave the East India Company a monopoly, angering colonial merchants.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Boston_Tea_Party_Currier_colored.jpg/640px-Boston_Tea_Party_Currier_colored.jpg', caption: 'The Boston Tea Party, 1773 (Currier & Ives, public domain)' } },
            { topic: '3.2', type: 'multiple_choice', stem: 'The Intolerable Acts (1774) were Britain\'s response to:', choices: ['The Boston Massacre', 'The Boston Tea Party', 'The Stamp Act protests', 'Lexington and Concord'], correct: 1, explanation: 'Parliament passed the Coercive (Intolerable) Acts to punish Massachusetts for the Tea Party, closing Boston Harbor.' },
            { topic: '3.2', type: 'multiple_choice', stem: 'Colonists used John Locke\'s ideas to argue that:', choices: ['Kings ruled by divine right', 'Citizens had natural rights and could overthrow unjust government', 'Parliament had absolute power', 'Religion should govern politics'], correct: 1, explanation: 'Locke\'s social contract theory — that government must protect rights and derives power from the people — justified resistance to British rule.' },

            // Topic 3.3
            { topic: '3.3', type: 'multiple_choice', stem: 'The Declaration of Independence (1776) was primarily written by:', choices: ['Benjamin Franklin', 'John Adams', 'Thomas Jefferson', 'George Washington'], correct: 2, explanation: 'Thomas Jefferson drafted the Declaration, drawing on Enlightenment philosophy and natural rights theory.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/United_States_Declaration_of_Independence.jpg/480px-United_States_Declaration_of_Independence.jpg', caption: 'The Declaration of Independence, 1776 (National Archives)' } },
            { topic: '3.3', type: 'multiple_choice', stem: 'The Battle of Saratoga (1777) was a turning point because it:', choices: ['Ended the war', 'Convinced France to ally with the Americans', 'Led to British control of New England', 'Ended slavery in the North'], correct: 1, explanation: 'France entered the war as an American ally after Saratoga, providing crucial military and financial support.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Washington_Crossing_the_Delaware_by_Emanuel_Leutze%2C_MMA-NYC%2C_1851.jpg/640px-Washington_Crossing_the_Delaware_by_Emanuel_Leutze%2C_MMA-NYC%2C_1851.jpg', caption: 'Washington Crossing the Delaware by Emanuel Leutze, 1851 (public domain)' } },
            { topic: '3.3', type: 'multiple_choice', stem: 'Thomas Paine\'s "Common Sense" (1776) argued that:', choices: ['Colonists should remain loyal to the king', 'Independence was necessary and monarchy was absurd', 'Britain was treating colonists fairly', 'A strong army would solve all problems'], correct: 1, explanation: 'Paine\'s pamphlet used simple language to persuade ordinary colonists that independence was both necessary and just.' },
            { topic: '3.3', type: 'multiple_choice', stem: 'The Treaty of Paris (1783) gave the United States territory extending to:', choices: ['The Appalachian Mountains', 'The Pacific Ocean', 'The Mississippi River', 'The Great Lakes only'], correct: 2, explanation: 'Britain recognized American independence and ceded land from the Atlantic to the Mississippi River.' },

            // Topic 3.4
            { topic: '3.4', type: 'multiple_choice', stem: 'Under the Articles of Confederation, Congress could NOT:', choices: ['Declare war', 'Make treaties', 'Levy (collect) taxes directly', 'Print money'], correct: 2, explanation: 'Congress could only request money from states; it had no power to tax citizens directly — a crippling weakness.' },
            { topic: '3.4', type: 'multiple_choice', stem: 'Shays\' Rebellion (1786-87) demonstrated:', choices: ['The strength of the federal government', 'The weakness of the government under the Articles of Confederation', 'That democracy worked perfectly', 'That farmers were not important'], correct: 1, explanation: 'When the government couldn\'t suppress a farmers\' rebellion in Massachusetts, it alarmed leaders into calling the Constitutional Convention.' },
            { topic: '3.4', type: 'multiple_choice', stem: 'The Northwest Ordinance (1787) was significant because it:', choices: ['Created the District of Columbia', 'Organized territory north of the Ohio River and banned slavery there', 'Established the first permanent Western settlement', 'Created the Supreme Court'], correct: 1, explanation: 'The Northwest Ordinance established a process for new states and banned slavery in the Northwest Territory — a major precedent.' },

            // Topic 3.5
            { topic: '3.5', type: 'multiple_choice', stem: 'The Great Compromise at the Constitutional Convention resolved the dispute over:', choices: ['Slavery', 'Presidential powers', 'Congressional representation between large and small states', 'Taxation'], correct: 2, explanation: 'The Great Compromise created a bicameral Congress — a Senate with equal state representation and a House based on population.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Scene_at_the_Signing_of_the_Constitution_of_the_United_States.jpg/640px-Scene_at_the_Signing_of_the_Constitution_of_the_United_States.jpg', caption: 'Scene at the Signing of the Constitution by Howard Chandler Christy, 1940 (public domain)' } },
            { topic: '3.5', type: 'multiple_choice', stem: 'The Three-Fifths Compromise counted enslaved people as:', choices: ['Full citizens', 'Three-fifths of a person for representation and taxation', 'Not counted at all', 'Half a person'], correct: 1, explanation: 'The Three-Fifths Compromise gave Southern states more representation by counting enslaved people as 3/5 of a person.' },
            { topic: '3.5', type: 'multiple_choice', stem: 'Anti-Federalists demanded a Bill of Rights in order to:', choices: ['Strengthen the federal government', 'Protect individual rights from federal government power', 'Give states more military power', 'Create a stronger executive'], correct: 1, explanation: 'Anti-Federalists feared the new government would trample individual liberties without specific protections listed in the Constitution.' },
            { topic: '3.5', type: 'multiple_choice', stem: 'The Federalist Papers were written to:', choices: ['Oppose the Constitution', 'Argue for ratification of the Constitution', 'Propose a monarchy', 'Reform the Articles of Confederation'], correct: 1, explanation: 'Hamilton, Madison, and Jay wrote 85 essays explaining and defending the Constitution to persuade New York to ratify.' },

            // Topic 3.6
            { topic: '3.6', type: 'multiple_choice', stem: 'Hamilton and Jefferson disagreed most fundamentally about:', choices: ['The location of the capital', 'Whether the national government should be strong or limited', 'Whether to ally with France or Britain in foreign policy only', 'Whether George Washington should be president'], correct: 1, explanation: 'Hamilton wanted a powerful national government promoting commerce and industry; Jefferson favored limited government and agrarian democracy.' },
            { topic: '3.6', type: 'multiple_choice', stem: 'Marbury v. Madison (1803) established the principle of:', choices: ['Presidential veto power', 'Judicial review — the Supreme Court\'s power to strike down unconstitutional laws', 'State sovereignty', 'Freedom of religion'], correct: 1, explanation: 'Chief Justice Marshall\'s ruling established that the Supreme Court could declare laws unconstitutional — a cornerstone of American government.' },
            { topic: '3.6', type: 'multiple_choice', stem: 'The "Revolution of 1800" was significant because:', choices: ['It involved armed conflict', 'Power peacefully transferred from Federalists to Democratic-Republicans — a first in world history', 'Jefferson abolished the Constitution', 'It ended the two-party system'], correct: 1, explanation: 'Jefferson\'s election demonstrated that power could transfer peacefully between rival political parties — a revolutionary concept at the time.' },

            // ===== UNIT 4: Period 4, 1800-1848 =====
            // Topic 4.1
            { topic: '4.1', type: 'multiple_choice', stem: 'The Louisiana Purchase (1803) was controversial because:', choices: ['It was too expensive', 'The Constitution did not explicitly give the president power to buy foreign territory', 'France refused to sell', 'Congress voted against it'], correct: 1, explanation: 'Jefferson, a strict constructionist, struggled with whether the Constitution authorized such a large territorial purchase.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Louisiana_Purchase.png/640px-Louisiana_Purchase.png', caption: 'The Louisiana Purchase territory, 1803 (public domain)' } },
            { topic: '4.1', type: 'multiple_choice', stem: 'The Missouri Compromise (1820) resolved tension over:', choices: ['Trade with Britain', 'Whether Missouri would be a slave or free state', 'Taxation of Southern goods', 'The Louisiana Purchase price'], correct: 1, explanation: 'Missouri was admitted as a slave state, Maine as free, and slavery was banned north of 36°30\' — temporarily balancing sectional interests.' },
            { topic: '4.1', type: 'multiple_choice', stem: 'John Marshall\'s Supreme Court decisions generally:', choices: ['Strengthened state power over federal government', 'Strengthened federal government power and national unity', 'Protected slavery from federal interference', 'Limited presidential power'], correct: 1, explanation: 'Marshall\'s rulings consistently expanded federal power and upheld national government supremacy over states.' },

            // Topic 4.2
            { topic: '4.2', type: 'multiple_choice', stem: 'The Erie Canal (1825) was significant because it:', choices: ['Connected the Atlantic and Pacific oceans', 'Linked the Great Lakes to New York City, transforming trade', 'Was the first railroad in America', 'Allowed ships to bypass New Orleans'], correct: 1, explanation: 'The Erie Canal dramatically reduced shipping costs, making New York City the commercial capital and opening western markets.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Erie_canal_1905.jpg/640px-Erie_canal_1905.jpg', caption: 'The Erie Canal, c. 1905 (public domain)' } },
            { topic: '4.2', type: 'multiple_choice', stem: 'The "Cult of Domesticity" described the idea that:', choices: ['All women should work in factories', 'Middle-class women\'s proper sphere was the home as wife and mother', 'Women should have equal political rights', 'Domestic servants should have rights'], correct: 1, explanation: 'The Cult of Domesticity idealized middle-class women as moral guardians of the home, separate from the public/commercial world.' },
            { topic: '4.2', type: 'multiple_choice', stem: 'The Market Revolution transformed America by:', choices: ['Eliminating all agriculture', 'Shifting production from local subsistence to national market economy', 'Reducing transportation costs in the South', 'Ending immigration'], correct: 1, explanation: 'The Market Revolution connected local economies into a national market through transportation improvements, factories, and commercial agriculture.' },

            // Topic 4.3
            { topic: '4.3', type: 'multiple_choice', stem: 'Andrew Jackson\'s "spoils system" meant:', choices: ['Dividing conquered Native lands among settlers', 'Rewarding political supporters with government jobs', 'Sharing war booty with soldiers', 'A new tax system'], correct: 1, explanation: 'Jackson\'s "to the victors belong the spoils" rewarded Democratic Party loyalists with federal appointments.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Andrew_jackson_head.jpg/440px-Andrew_jackson_head.jpg', caption: 'President Andrew Jackson (Library of Congress, public domain)' } },
            { topic: '4.3', type: 'multiple_choice', stem: 'The Trail of Tears (1838-39) resulted from the:', choices: ['Homestead Act', 'Indian Removal Act of 1830', 'Kansas-Nebraska Act', 'Dawes Act'], correct: 1, explanation: 'Jackson\'s Indian Removal Act forced the Cherokee and other tribes off their lands on a brutal march to Oklahoma.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Trail_of_Tears_map_NPS.jpg/640px-Trail_of_Tears_map_NPS.jpg', caption: 'Trail of Tears routes, 1836–1839 (National Park Service)' } },
            { topic: '4.3', type: 'multiple_choice', stem: 'The Nullification Crisis of 1832-33 involved:', choices: ['South Carolina claiming it could void federal tariff laws', 'A state declaring independence', 'Nullifying slavery laws', 'Jackson nullifying a Supreme Court ruling'], correct: 0, explanation: 'South Carolina declared federal tariffs null and void within its borders; Jackson threatened force, and a compromise tariff resolved the crisis.' },
            { topic: '4.3', type: 'multiple_choice', stem: 'Jackson opposed the Second Bank of the United States because he believed it:', choices: ['Was unconstitutional and favored the wealthy elite', 'Printed too much money', 'Was controlled by foreign investors', 'Was too small'], correct: 0, explanation: 'Jackson called the Bank a "monster" that benefited wealthy Eastern elites and foreign investors at the expense of ordinary Americans.' },

            // Topic 4.4
            { topic: '4.4', type: 'multiple_choice', stem: 'Manifest Destiny was the belief that:', choices: ['God predestined some people for salvation', 'The U.S. was destined to expand to the Pacific Ocean', 'All people should become Americans', 'The South would eventually dominate the North'], correct: 1, explanation: 'Manifest Destiny held that American expansion across the continent was both inevitable and divinely ordained.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/American_progress.JPG/640px-American_progress.JPG', caption: 'American Progress by John Gast, 1872 (public domain)' } },
            { topic: '4.4', type: 'multiple_choice', stem: 'The Mexican-American War (1846-48) resulted in the U.S. gaining:', choices: ['Only Texas', 'Only California', 'The Mexican Cession — California, the Southwest, and the Great Basin', 'All of Mexico'], correct: 2, explanation: 'The Treaty of Guadalupe Hidalgo gave the U.S. over 500,000 square miles including California, New Mexico, Arizona, Nevada, and Utah.' },
            { topic: '4.4', type: 'multiple_choice', stem: 'The battle of the Alamo (1836) became a rallying cry for:', choices: ['Mexican independence', 'Texan independence from Mexico', 'American annexation of California', 'The abolition of slavery'], correct: 1, explanation: '"Remember the Alamo!" inspired Texan fighters who went on to defeat Santa Anna and win independence.' },

            // Topic 4.5
            { topic: '4.5', type: 'multiple_choice', stem: 'William Lloyd Garrison\'s newspaper The Liberator (1831) demanded:', choices: ['Gradual emancipation of slaves', 'Immediate, unconditional emancipation', 'Colonization of freed slaves in Africa', 'Compensation for slave owners'], correct: 1, explanation: 'Garrison\'s radical abolitionism demanded immediate emancipation without compensation, making him controversial even in the North.' },
            { topic: '4.5', type: 'multiple_choice', stem: 'The Seneca Falls Convention (1848) primarily demanded:', choices: ['Abolition of slavery', 'Equal rights for women, including the right to vote', 'Religious freedom', 'Temperance laws'], correct: 1, explanation: 'Organized by Elizabeth Cady Stanton and Lucretia Mott, Seneca Falls launched the organized women\'s rights movement in America.' },
            { topic: '4.5', type: 'multiple_choice', stem: 'Frederick Douglass was significant as:', choices: ['A Union general', 'An escaped slave who became a powerful abolitionist orator and writer', 'The founder of the Republican Party', 'A supporter of colonization'], correct: 1, explanation: 'Douglass\'s autobiography and speeches powerfully argued against slavery using his own experience as an enslaved person.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Frederick_Douglass_portrait.jpg/440px-Frederick_Douglass_portrait.jpg', caption: 'Frederick Douglass, c. 1879 (public domain)' } },

            // Topic 4.6
            { topic: '4.6', type: 'multiple_choice', stem: 'The Second Great Awakening most directly fueled:', choices: ['American imperialism', 'Social reform movements including abolitionism', 'The growth of atheism', 'Support for slavery'], correct: 1, explanation: 'Revivalist religion emphasized moral responsibility, leading many believers to oppose sins like slavery and alcohol.' },
            { topic: '4.6', type: 'multiple_choice', stem: 'Charles Finney differed from earlier Calvinist preachers by emphasizing:', choices: ['Predestination — that God had already chosen who was saved', 'Free will — that individuals could choose salvation', 'The importance of church hierarchy', 'Racial equality'], correct: 1, explanation: 'Finney\'s revivalism rejected Calvinist predestination, teaching that individuals could choose God — democratizing salvation.' },
            { topic: '4.6', type: 'multiple_choice', stem: 'Dorothea Dix\'s reform work focused on:', choices: ['Women\'s suffrage', 'Abolition of slavery', 'Humane treatment of the mentally ill in prisons and asylums', 'Temperance'], correct: 2, explanation: 'Dix documented horrible conditions in asylums and prisons, convincing legislatures to create separate humane institutions.' },

            // ===== UNIT 5: Period 5, 1844-1877 =====
            // Topic 5.1
            { topic: '5.1', type: 'multiple_choice', stem: 'The Compromise of 1850 included a stronger Fugitive Slave Act that:', choices: ['Freed enslaved people in Washington D.C.', 'Required Northerners to return escaped slaves to their owners', 'Banned slavery in California', 'Allowed territories to decide on slavery by majority vote'], correct: 1, explanation: 'The Fugitive Slave Act outraged many Northerners who now had to actively participate in the slave system.' },
            { topic: '5.1', type: 'multiple_choice', stem: 'The Dred Scott decision (1857) ruled that:', choices: ['Slavery was illegal in territories', 'Congress had no power to ban slavery anywhere and enslaved people were property, not citizens', 'Territories could ban slavery by popular vote', 'Free Black people were full citizens'], correct: 1, explanation: 'Chief Justice Taney\'s ruling declared that enslaved people had no constitutional rights and Congress could not prohibit slavery in territories.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Dred_Scott_photograph_%281857%29.jpg/360px-Dred_Scott_photograph_%281857%29.jpg', caption: 'Dred Scott, 1857 (public domain)' } },
            { topic: '5.1', type: 'multiple_choice', stem: '"Bleeding Kansas" referred to:', choices: ['A drought that devastated Kansas farms', 'Violence between pro- and anti-slavery settlers after the Kansas-Nebraska Act', 'A Native American war in Kansas', 'A flood that killed Kansas settlers'], correct: 1, explanation: 'The Kansas-Nebraska Act\'s popular sovereignty principle led to a mini civil war as both sides rushed to control Kansas.' },
            { topic: '5.1', type: 'multiple_choice', stem: 'The Kansas-Nebraska Act (1854) was significant because it:', choices: ['Added Kansas and Nebraska to the Union', 'Effectively repealed the Missouri Compromise by allowing popular sovereignty on slavery', 'Banned slavery north of Missouri', 'Created a new political party'], correct: 1, explanation: 'By allowing Kansas and Nebraska voters to decide on slavery, the Act overturned the Missouri Compromise\'s geographic boundary.' },

            // Topic 5.2
            { topic: '5.2', type: 'multiple_choice', stem: 'The Republican Party was founded in 1854 primarily to oppose:', choices: ['Immigration', 'The expansion of slavery into new territories', 'The Bank of the United States', 'British trade policy'], correct: 1, explanation: 'The Republican Party united former Whigs, Free Soilers, and anti-slavery Democrats around opposing slavery\'s expansion.' },
            { topic: '5.2', type: 'multiple_choice', stem: 'John Brown\'s raid on Harpers Ferry (1859) was intended to:', choices: ['Start a political campaign against slavery', 'Spark a slave rebellion by seizing weapons', 'Assassinate President Buchanan', 'Free slaves in Virginia peacefully'], correct: 1, explanation: 'Brown hoped to seize the federal arsenal and use the weapons to arm enslaved people for a mass uprising.' },
            { topic: '5.2', type: 'multiple_choice', stem: 'The Southern states seceded immediately after:', choices: ['The Dred Scott decision', 'John Brown\'s raid', 'Lincoln\'s election in 1860', 'The firing on Fort Sumter'], correct: 2, explanation: 'Southern states began seceding in December 1860 after Lincoln won without carrying a single Southern state.' },

            // Topic 5.3
            { topic: '5.3', type: 'multiple_choice', stem: 'The turning point of the Civil War in July 1863 involved two Union victories:', choices: ['Antietam and Bull Run', 'Gettysburg and Vicksburg', 'Shiloh and Chancellorsville', 'Atlanta and Savannah'], correct: 1, explanation: 'Gettysburg ended Lee\'s invasion of the North; Vicksburg gave the Union control of the Mississippi River.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Battle_of_Gettysburg%2C_by_Currier_and_Ives.png/640px-Battle_of_Gettysburg%2C_by_Currier_and_Ives.png', caption: 'Battle of Gettysburg, Currier & Ives (public domain)' } },
            { topic: '5.3', type: 'multiple_choice', stem: 'The Union\'s main advantage over the Confederacy was:', choices: ['Better military leadership', 'Stronger defensive position', 'Larger population and industrial capacity', 'Support from European allies'], correct: 2, explanation: 'The Union had 22 million people vs. 9 million (including 3.5 million enslaved), plus factories, railroads, and a navy.' },
            { topic: '5.3', type: 'multiple_choice', stem: 'Sherman\'s March to the Sea (1864) was a strategy of:', choices: ['Quick frontal assault', 'Total war — destroying the South\'s economic capacity and will to fight', 'Blockading Southern ports', 'Negotiating peace with Confederates'], correct: 1, explanation: 'Sherman deliberately destroyed Confederate supply lines, farms, and railroads to break the South\'s ability and will to continue the war.' },

            // Topic 5.4
            { topic: '5.4', type: 'multiple_choice', stem: 'The Emancipation Proclamation (1863) freed enslaved people in:', choices: ['All states', 'All Northern states', 'Confederate states in rebellion', 'Border states only'], correct: 2, explanation: 'The Proclamation freed enslaved people in rebel states but not in Union border states — Lincoln used his war powers as justification.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Emancipation_Proclamation_original.jpg/480px-Emancipation_Proclamation_original.jpg', caption: 'The Emancipation Proclamation, January 1, 1863 (National Archives)' } },
            { topic: '5.4', type: 'multiple_choice', stem: 'A major effect of the Emancipation Proclamation was:', choices: ['Immediate end to the war', 'Preventing European nations from supporting the Confederacy', 'Freeing all enslaved people immediately', 'Angering most Northerners'], correct: 1, explanation: 'By making the war explicitly about slavery, it was politically impossible for Britain or France to support the Confederacy.' },
            { topic: '5.4', type: 'multiple_choice', stem: 'The Gettysburg Address (1863) redefined the war\'s purpose as:', choices: ['Protecting constitutional rights of states', 'A struggle for human equality and "a new birth of freedom"', 'Punishing the South for secession', 'Restoring the Union without addressing slavery'], correct: 1, explanation: 'Lincoln connected the war to the Declaration of Independence\'s promise of equality, transforming its meaning.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Abraham_Lincoln_O-77_matte_collodion_print.jpg/400px-Abraham_Lincoln_O-77_matte_collodion_print.jpg', caption: 'President Abraham Lincoln, 1863 (Library of Congress)' } },

            // Topic 5.5
            { topic: '5.5', type: 'multiple_choice', stem: 'The 14th Amendment (1868) guaranteed:', choices: ['Voting rights for Black men', 'Equal protection and citizenship for all persons born in the U.S.', 'An end to slavery', 'Women\'s suffrage'], correct: 1, explanation: 'The 14th Amendment defined citizenship and guaranteed equal protection of the laws — a cornerstone of civil rights law.' },
            { topic: '5.5', type: 'multiple_choice', stem: 'During Reconstruction, Black men in the South:', choices: ['Were immediately given full economic equality', 'Voted and held political office at state and federal levels', 'Were not allowed to vote', 'Only worked as sharecroppers'], correct: 1, explanation: 'With federal protection, Black men voted in large numbers and served as elected officials — including two U.S. senators.' },
            { topic: '5.5', type: 'multiple_choice', stem: 'The Freedmen\'s Bureau provided formerly enslaved people with:', choices: ['Forty acres and a mule to every family', 'Food, education, and legal assistance', 'Full voting rights only', 'Reparations payments'], correct: 1, explanation: 'The Freedmen\'s Bureau offered crucial services but was underfunded and faced hostility from Johnson and Southern whites.' },

            // Topic 5.6
            { topic: '5.6', type: 'multiple_choice', stem: 'The Compromise of 1877 effectively ended Reconstruction by:', choices: ['Granting Black Southerners full economic rights', 'Removing federal troops from the South in exchange for Republican presidency', 'Creating the NAACP', 'Passing the 15th Amendment'], correct: 1, explanation: 'The deal gave Hayes the disputed presidency while Democrats got the withdrawal of federal troops that had protected Black Southerners.' },
            { topic: '5.6', type: 'multiple_choice', stem: 'Plessy v. Ferguson (1896) established the principle of:', choices: ['Separate but equal — upholding racial segregation', 'Integration of all public schools', 'Equal rights for all races', 'Voting rights for Black Americans'], correct: 0, explanation: 'The Supreme Court ruled that racial segregation was constitutional as long as facilities were "separate but equal" — overturned in 1954.' },
            { topic: '5.6', type: 'multiple_choice', stem: 'Sharecropping replaced slavery in the South by:', choices: ['Giving formerly enslaved people land ownership', 'Trapping Black farmers in debt cycles on white-owned land', 'Providing equal wages to all farm workers', 'Ending racial discrimination in agriculture'], correct: 1, explanation: 'Sharecroppers were trapped by debt to landlords and merchants, creating economic bondage that replaced the legal bondage of slavery.' },

            // ===== UNIT 6: Period 6, 1865-1898 =====
            // Topic 6.1
            { topic: '6.1', type: 'multiple_choice', stem: 'Mark Twain called the late 19th century the "Gilded Age" because:', choices: ['Gold was discovered everywhere', 'It glittered with wealth on the surface but had corruption and inequality beneath', 'It was a golden age of democracy', 'Gold was used as currency'], correct: 1, explanation: 'Twain\'s term captured the era\'s dazzling prosperity concealing deep inequality, corruption, and exploitation.' },
            { topic: '6.1', type: 'multiple_choice', stem: 'The Transcontinental Railroad, completed in 1869, was built primarily by:', choices: ['American-born workers only', 'Chinese and Irish immigrant laborers', 'Enslaved people', 'The U.S. Army'], correct: 1, explanation: 'Chinese immigrants built the western section and Irish immigrants the eastern; both labored in dangerous conditions for low pay.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/East_and_West_Shaking_hands_at_the_laying_of_last_rail_Union_Pacific_Railroad_-_Restoration.jpg/640px-East_and_West_Shaking_hands_at_the_laying_of_last_rail_Union_Pacific_Railroad_-_Restoration.jpg', caption: 'Golden Spike ceremony, Promontory Summit, Utah, 1869 (public domain)' } },
            { topic: '6.1', type: 'multiple_choice', stem: 'Andrew Carnegie\'s "Gospel of Wealth" argued that:', choices: ['Workers deserved high wages', 'The wealthy had a duty to use their riches for public benefit', 'Government should control big business', 'Wealth was spiritually dangerous'], correct: 1, explanation: 'Carnegie believed wealthy men should manage their fortunes as trustees for society — justifying inequality while encouraging philanthropy.' },

            // Topic 6.2
            { topic: '6.2', type: 'multiple_choice', stem: 'Vertical integration (used by Carnegie) meant:', choices: ['Merging with competitors', 'Controlling all stages of production from raw materials to finished product', 'Raising prices as high as possible', 'Paying workers less than competitors'], correct: 1, explanation: 'Carnegie controlled his own iron mines, steel mills, and railroads — capturing profit at every stage of production.' },
            { topic: '6.2', type: 'multiple_choice', stem: 'The Sherman Antitrust Act (1890) was passed to:', choices: ['Support big business expansion', 'Break up monopolies that restrained trade', 'Regulate the stock market', 'Control railroad rates'], correct: 1, explanation: 'The Sherman Act was the first federal law against monopolies, though it was initially used more against labor unions than corporations.' },
            { topic: '6.2', type: 'multiple_choice', stem: 'John D. Rockefeller\'s Standard Oil is an example of:', choices: ['Vertical integration', 'Horizontal integration — dominating one industry by buying out competitors', 'A government-owned enterprise', 'A worker cooperative'], correct: 1, explanation: 'Rockefeller used horizontal integration to control 90% of American oil refining by buying out or destroying competitors.' },

            // Topic 6.3
            { topic: '6.3', type: 'multiple_choice', stem: 'The Knights of Labor was distinctive for:', choices: ['Accepting only skilled workers', 'Being open to all workers including women and Black workers', 'Focusing only on higher wages', 'Opposing government regulation'], correct: 1, explanation: 'Unlike most unions, the Knights accepted workers regardless of skill, race, or gender — radical for the 1880s.' },
            { topic: '6.3', type: 'multiple_choice', stem: 'The Homestead Strike (1892) was significant because:', choices: ['Workers won a major wage increase', 'Carnegie Steel used Pinkerton detectives and National Guard to crush the union', 'It led to new federal labor laws', 'It was the first national strike'], correct: 1, explanation: 'The crushing of the Homestead Strike showed that corporations could use private and government force to defeat labor organizing.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/The_Carnegie_Steel_Company%27s_Homestead_Steel_Works_in_1892.jpg/640px-The_Carnegie_Steel_Company%27s_Homestead_Steel_Works_in_1892.jpg', caption: 'Carnegie Steel Company\'s Homestead Works, 1892 (public domain)' } },
            { topic: '6.3', type: 'multiple_choice', stem: 'The American Federation of Labor (AFL) focused on:', choices: ['Revolutionary overthrow of capitalism', 'Organizing all workers into one big union', '"Pure and simple" demands — better wages, hours, and conditions for skilled workers', 'Political reform only'], correct: 2, explanation: 'Samuel Gompers\' AFL was pragmatic, focusing on immediate, concrete improvements for skilled tradespeople rather than radical politics.' },

            // Topic 6.4
            { topic: '6.4', type: 'multiple_choice', stem: 'Jim Crow laws enforced:', choices: ['Child labor protections', 'Racial segregation in all areas of public life', 'Equal wages for Black and white workers', 'Voting rights for Black men'], correct: 1, explanation: 'Jim Crow laws mandated racial separation in schools, transportation, restaurants, and virtually every public space.' },
            { topic: '6.4', type: 'multiple_choice', stem: 'Booker T. Washington advocated for Black progress through:', choices: ['Immediate demands for full civil rights', 'Industrial and vocational education and economic self-sufficiency', 'Armed resistance', 'Emigration to Africa'], correct: 1, explanation: 'Washington\'s "Atlanta Compromise" accepted temporary political inequality in exchange for economic opportunity and education.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Booker_T_Washington_retouched_flattened.jpg/440px-Booker_T_Washington_retouched_flattened.jpg', caption: 'Booker T. Washington (Library of Congress, public domain)' } },
            { topic: '6.4', type: 'multiple_choice', stem: 'W.E.B. Du Bois disagreed with Booker T. Washington by demanding:', choices: ['Slower progress for Black Americans', 'Immediate and full civil and political rights', 'Separate Black nation', 'Focus only on vocational training'], correct: 1, explanation: 'Du Bois criticized Washington\'s accommodationism, arguing that political rights must accompany economic progress.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/WEB_Du_Bois_1918.jpg/440px-WEB_Du_Bois_1918.jpg', caption: 'W.E.B. Du Bois, 1918 (public domain)' } },

            // Topic 6.5
            { topic: '6.5', type: 'multiple_choice', stem: 'The Dawes Act (1887) was intended to:', choices: ['Give Native Americans more reservation land', 'Assimilate Native Americans by breaking up tribal lands into individual allotments', 'Protect Native American culture', 'Create Native American states'], correct: 1, explanation: 'The Dawes Act broke up reservations into individual plots, with "surplus" land sold to whites — devastating tribal land ownership.' },
            { topic: '6.5', type: 'multiple_choice', stem: 'The Battle of Little Bighorn (1876) resulted in:', choices: ['A major U.S. Army victory over the Sioux', 'The destruction of Custer\'s force by Lakota and Cheyenne warriors', 'A peace treaty with the Plains tribes', 'The end of the Indian Wars'], correct: 1, explanation: 'Sitting Bull and Crazy Horse led a combined force that wiped out Custer\'s 7th Cavalry — though the U.S. ultimately prevailed.' },
            { topic: '6.5', type: 'multiple_choice', stem: 'The mass slaughter of buffalo in the 1870s-80s affected Plains Indians by:', choices: ['Improving their food supply', 'Destroying their primary food source and way of life', 'Forcing them to farm', 'Strengthening their resistance'], correct: 1, explanation: 'The deliberate destruction of bison herds was partly a military strategy to starve Plains peoples into submission.' },

            // Topic 6.6
            { topic: '6.6', type: 'multiple_choice', stem: '"Yellow journalism" during the Spanish-American War refers to:', choices: ['Cowardly war reporting', 'Sensationalized, exaggerated reporting designed to inflame public opinion and increase newspaper sales', 'Accurate war coverage', 'Anti-war journalism'], correct: 1, explanation: 'Newspapers like Hearst\'s New York Journal published sensationalized stories about Spanish atrocities to sell papers and push America toward war.' },
            { topic: '6.6', type: 'multiple_choice', stem: 'As a result of the Spanish-American War (1898), the U.S. gained:', choices: ['Cuba as a territory', 'Puerto Rico, Guam, and the Philippines', 'Florida and Louisiana', 'Canada'], correct: 1, explanation: 'The Treaty of Paris of 1898 gave the U.S. Puerto Rico, Guam, and the Philippines (purchased for $20 million).' },
            { topic: '6.6', type: 'multiple_choice', stem: 'Alfred Thayer Mahan\'s influential book argued that national power required:', choices: ['A large standing army', 'A powerful navy and overseas bases', 'Economic isolation', 'Democratic government'], correct: 1, explanation: 'Mahan\'s "The Influence of Sea Power Upon History" argued that naval dominance was essential to national greatness.' },

            // ===== UNIT 7: Period 7, 1890-1945 =====
            // Topic 7.1
            { topic: '7.1', type: 'multiple_choice', stem: 'Muckrakers were journalists who:', choices: ['Covered foreign policy only', 'Exposed corruption and social problems through investigative reporting', 'Supported big business', 'Worked for the government'], correct: 1, explanation: 'Muckrakers like Upton Sinclair, Ida Tarbell, and Lincoln Steffens used journalism to expose abuses that spurred reform.' },
            { topic: '7.1', type: 'multiple_choice', stem: 'Theodore Roosevelt\'s approach to the presidency was to use it as a:', choices: ['Ceremonial position only', '"Bully pulpit" — a platform to promote progressive reform', 'Vehicle for isolationism', 'Tool to help big business'], correct: 1, explanation: 'TR aggressively used presidential power to regulate trusts, protect consumers, and conserve natural resources.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/President_Roosevelt_-_Pach_Bros_%28cropped%29.jpg/440px-President_Roosevelt_-_Pach_Bros_%28cropped%29.jpg', caption: 'President Theodore Roosevelt (Library of Congress, public domain)' } },
            { topic: '7.1', type: 'multiple_choice', stem: 'The 19th Amendment (1920) granted:', choices: ['Prohibition of alcohol', 'Women the right to vote', 'Direct election of senators', 'The federal income tax'], correct: 1, explanation: 'After decades of suffrage campaigning, the 19th Amendment finally gave American women the right to vote.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Suffrage_parade%2C_New_York_City%2C_May_6%2C_1912.jpg/640px-Suffrage_parade%2C_New_York_City%2C_May_6%2C_1912.jpg', caption: 'Women\'s suffrage parade, New York City, 1912 (public domain)' } },
            { topic: '7.1', type: 'multiple_choice', stem: 'Upton Sinclair\'s The Jungle (1906) led to:', choices: ['Abolition of child labor', 'The Pure Food and Drug Act and Meat Inspection Act', 'Break-up of Standard Oil', 'Women\'s suffrage'], correct: 1, explanation: 'Sinclair\'s graphic description of meatpacking conditions horrified the public and prompted federal food safety legislation.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Thejungle.jpg/400px-Thejungle.jpg', caption: 'First edition cover of The Jungle by Upton Sinclair, 1906 (public domain)' } },

            // Topic 7.2
            { topic: '7.2', type: 'multiple_choice', stem: 'The Zimmermann Telegram (1917) proposed:', choices: ['Peace between Germany and the U.S.', 'A German-Mexico military alliance against the United States', 'German surrender terms', 'An arms limitation agreement'], correct: 1, explanation: 'Germany\'s proposal that Mexico attack the U.S. in exchange for recovering Texas, New Mexico, and Arizona outraged Americans.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Zimmermann_Telegram.jpg/480px-Zimmermann_Telegram.jpg', caption: 'The Zimmermann Telegram, January 1917 (National Archives)' } },
            { topic: '7.2', type: 'multiple_choice', stem: 'Wilson\'s Fourteen Points included:', choices: ['U.S. annexation of German colonies', 'A League of Nations to maintain international peace', 'Harsh reparations on Germany', 'Continuation of colonial empires'], correct: 1, explanation: 'The Fourteen Points proposed self-determination, freedom of the seas, disarmament, and most importantly a League of Nations.' },
            { topic: '7.2', type: 'multiple_choice', stem: 'The U.S. Senate rejected the Treaty of Versailles because:', choices: ['The terms were too harsh on Germany', 'It would commit the U.S. to the League of Nations and potentially to foreign wars', 'Wilson refused to negotiate', 'France opposed American ratification'], correct: 1, explanation: 'Senator Henry Cabot Lodge and other "irreconcilables" opposed joining the League as a threat to American sovereignty.' },

            // Topic 7.3
            { topic: '7.3', type: 'multiple_choice', stem: 'The Harlem Renaissance was a:', choices: ['Political movement demanding Black suffrage', 'Flowering of African American art, music, and literature in New York', 'Religious revival in Northern cities', 'Athletic competition among Black colleges'], correct: 1, explanation: 'The Harlem Renaissance (1920s-30s) produced landmark works by Langston Hughes, Zora Neale Hurston, and others.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Langston_Hughes_by_Carl_Van_Vechten%2C_1936.jpg/440px-Langston_Hughes_by_Carl_Van_Vechten%2C_1936.jpg', caption: 'Langston Hughes by Carl Van Vechten, 1936 (public domain)' } },
            { topic: '7.3', type: 'multiple_choice', stem: 'Prohibition (18th Amendment, 1919) led to:', choices: ['Elimination of alcohol use', 'Growth of organized crime and bootlegging', 'Stronger enforcement of other laws', 'Decline of immigration'], correct: 1, explanation: 'Making alcohol illegal created a massive black market; organized crime figures like Al Capone made fortunes supplying bootleg liquor.' },
            { topic: '7.3', type: 'multiple_choice', stem: 'The Immigration Act of 1924:', choices: ['Opened America to all immigrants', 'Dramatically restricted immigration, especially from Southern/Eastern Europe and Asia', 'Only affected Asian immigrants', 'Increased immigration quotas'], correct: 1, explanation: 'The Act set quotas based on national origin (favoring Northwestern Europe) and virtually banned Asian immigration.' },

            // Topic 7.4
            { topic: '7.4', type: 'multiple_choice', stem: 'The Great Depression\'s most immediate cause was:', choices: ['German aggression', 'The stock market crash of 1929 combined with bank failures and declining consumer spending', 'A natural disaster', 'The Smoot-Hawley Tariff alone'], correct: 1, explanation: 'The Depression was caused by multiple interacting factors: stock speculation, overproduction, banking failures, and debt.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Lange-MigrantMother02.jpg/456px-Lange-MigrantMother02.jpg', caption: '"Migrant Mother" by Dorothea Lange, 1936 (Library of Congress)' } },
            { topic: '7.4', type: 'multiple_choice', stem: 'FDR\'s New Deal aimed at:', choices: ['Eliminating government from the economy', '"Relief, recovery, and reform" — helping people immediately, reviving the economy, and preventing future depressions', 'Military buildup only', 'Reversing Progressive Era reforms'], correct: 1, explanation: 'Roosevelt\'s three-part framework addressed immediate suffering, economic recovery, and long-term structural reform.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/FDR_1944_Color_Portrait.jpg/440px-FDR_1944_Color_Portrait.jpg', caption: 'President Franklin D. Roosevelt, 1944 (public domain)' } },
            { topic: '7.4', type: 'multiple_choice', stem: 'Social Security (1935) provided:', choices: ['Healthcare for all Americans', 'Retirement income and unemployment insurance', 'Free education through high school', 'Housing for the homeless'], correct: 1, explanation: 'Social Security created retirement benefits for workers and, later, unemployment insurance — the foundation of America\'s social safety net.' },

            // Topic 7.5
            { topic: '7.5', type: 'multiple_choice', stem: 'The Munich Agreement (1938) is remembered as an example of:', choices: ['Successful diplomacy', 'Appeasement — rewarding Hitler\'s aggression, which encouraged further aggression', 'Military deterrence', 'Collective security working'], correct: 1, explanation: 'Britain and France gave Hitler Czechoslovakia\'s Sudetenland hoping to satisfy him; he invaded the rest of Czechoslovakia 6 months later.' },
            { topic: '7.5', type: 'multiple_choice', stem: 'The Lend-Lease Act (1941) allowed the U.S. to:', choices: ['Draft American soldiers for European service', 'Supply Britain and other allies with war materials without immediate payment', 'Declare war on Germany', 'Impose economic sanctions on Japan'], correct: 1, explanation: 'Lend-Lease was a way to help Britain while technically maintaining neutrality — moving the U.S. closer to full involvement.' },
            { topic: '7.5', type: 'multiple_choice', stem: 'Pearl Harbor (December 7, 1941) was:', choices: ['A German attack on American ships', 'A Japanese surprise attack on the U.S. naval base in Hawaii', 'An American attack on Japan', 'A Japanese invasion of California'], correct: 1, explanation: 'Japan\'s surprise attack killed 2,400 Americans and destroyed much of the Pacific Fleet, leading Congress to declare war the next day.' },

            // Topic 7.6
            { topic: '7.6', type: 'multiple_choice', stem: 'Japanese American internment during WWII resulted in:', choices: ['Improved Japanese American rights', '120,000 Japanese Americans being forced into internment camps without due process', 'Deportation of Japanese Americans', 'No significant civil liberties violations'], correct: 1, explanation: 'Executive Order 9066 forced Japanese Americans into camps based purely on race — one of the worst civil liberties violations in American history.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Manzanar_War_Relocation_Center_barracks.jpg/640px-Manzanar_War_Relocation_Center_barracks.jpg', caption: 'Manzanar War Relocation Center, California (Ansel Adams / public domain)' } },
            { topic: '7.6', type: 'multiple_choice', stem: 'D-Day (June 6, 1944) was the Allied:', choices: ['Invasion of North Africa', 'Invasion of Normandy, France — beginning the liberation of Western Europe', 'Battle of the Bulge', 'Invasion of Italy'], correct: 1, explanation: 'The Normandy invasion was the largest amphibious assault in history and opened a Western front that hastened German defeat.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Into_the_Jaws_of_Death_23-0455M_edit.jpg/640px-Into_the_Jaws_of_Death_23-0455M_edit.jpg', caption: 'D-Day landing, Normandy, June 6, 1944 (U.S. Coast Guard, public domain)' } },
            { topic: '7.6', type: 'multiple_choice', stem: 'The atomic bombs dropped on Japan in 1945 caused:', choices: ['Germany\'s surrender', 'Japan\'s surrender, ending WWII', 'A Japanese counter-attack', 'Soviet entry into the Pacific war only'], correct: 1, explanation: 'The bombs on Hiroshima and Nagasaki (August 6 and 9, 1945) led directly to Japan\'s surrender on August 15, 1945.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Nagasakibomb.jpg/480px-Nagasakibomb.jpg', caption: 'Atomic bomb mushroom cloud over Nagasaki, August 9, 1945 (U.S. Army, public domain)' } },

            // ===== UNIT 8: Period 8, 1945-1980 =====
            // Topic 8.1
            { topic: '8.1', type: 'multiple_choice', stem: 'The policy of "containment" meant:', choices: ['Destroying communism worldwide', 'Stopping the spread of communism without directly attacking the Soviet Union', 'Containing Soviet nuclear weapons', 'Containing American domestic communists'], correct: 1, explanation: 'George Kennan proposed that the U.S. should firmly resist Soviet expansion wherever it occurred, without attacking the USSR directly.' },
            { topic: '8.1', type: 'multiple_choice', stem: 'The Marshall Plan (1947) provided:', choices: ['Military weapons to Western Europe', 'Economic aid to rebuild Western European economies and prevent communist influence', 'Military troops to defend Europe', 'Nuclear weapons to NATO allies'], correct: 1, explanation: 'The $13 billion Marshall Plan rebuilt Western European economies, making communism less appealing to war-devastated populations.' },
            { topic: '8.1', type: 'multiple_choice', stem: 'NATO (1949) was significant as:', choices: ['The world\'s first nuclear alliance', 'The first peacetime military alliance in American history', 'A United Nations organization', 'An economic union of Western nations'], correct: 1, explanation: 'NATO committed the U.S. to defend Western Europe — a revolutionary departure from American tradition of avoiding "entangling alliances."' },

            // Topic 8.2
            { topic: '8.2', type: 'multiple_choice', stem: 'McCarthyism referred to:', choices: ['Senator McCarthy\'s foreign policy', 'Making reckless, unsubstantiated accusations of communist activity that destroyed careers', 'A type of economic policy', 'Military strategy in Korea'], correct: 1, explanation: 'McCarthy\'s accusations of communist infiltration — mostly unsupported — destroyed careers and created a climate of fear.' },
            { topic: '8.2', type: 'multiple_choice', stem: 'The Korean War (1950-53) ended with:', choices: ['North Korean defeat and unification under South Korea', 'An armistice roughly at the original North-South border', 'Chinese military occupation of Korea', 'American withdrawal in defeat'], correct: 1, explanation: 'The armistice essentially restored the status quo before the war — a frustrating "tie" that cost 36,000 American lives.' },
            { topic: '8.2', type: 'multiple_choice', stem: 'Dwight Eisenhower\'s farewell address (1961) warned about the growing power of:', choices: ['The Soviet Union', 'The military-industrial complex', 'Political parties', 'Labor unions'], correct: 1, explanation: 'Eisenhower warned that the relationship between defense contractors and the military could distort national priorities and policy.' },

            // Topic 8.3
            { topic: '8.3', type: 'multiple_choice', stem: 'Brown v. Board of Education (1954) overturned:', choices: ['The Civil Rights Act of 1875', 'Plessy v. Ferguson\'s "separate but equal" doctrine', 'The Voting Rights Act', 'The 14th Amendment'], correct: 1, explanation: 'The Warren Court unanimously ruled that racially segregated schools were inherently unequal and unconstitutional.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Little_Rock_Desegregation_1957.jpg/480px-Little_Rock_Desegregation_1957.jpg', caption: 'Integration of Little Rock Central High School, 1957 (public domain)' } },
            { topic: '8.3', type: 'multiple_choice', stem: 'The Montgomery Bus Boycott (1955-56) resulted in:', choices: ['MLK\'s arrest and end of protests', 'Desegregation of Montgomery\'s buses and MLK\'s rise to national prominence', 'Federal legislation banning bus segregation nationwide', 'Violence that ended the Civil Rights Movement'], correct: 1, explanation: 'The 381-day boycott succeeded in integrating Montgomery\'s buses and made King a national figure.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Rosa_Parks_Booking.jpg/400px-Rosa_Parks_Booking.jpg', caption: 'Rosa Parks fingerprinted after arrest, Montgomery, Alabama, 1955 (public domain)' } },
            { topic: '8.3', type: 'multiple_choice', stem: 'The Civil Rights Act (1964) banned:', choices: ['Slavery in all forms', 'Discrimination in public accommodations and employment based on race, religion, sex, or national origin', 'Poll taxes', 'School segregation only'], correct: 1, explanation: 'The landmark Act prohibited discrimination in hotels, restaurants, and employment — ending the legal basis of Jim Crow.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Martin_Luther_King_Jr_at_the_March_on_Washington_%28edit%29.jpg/480px-Martin_Luther_King_Jr_at_the_March_on_Washington_%28edit%29.jpg', caption: 'Dr. Martin Luther King Jr. at the March on Washington, August 28, 1963 (public domain)' } },
            { topic: '8.3', type: 'multiple_choice', stem: 'The Voting Rights Act (1965) was passed in response to:', choices: ['The March on Washington', 'Voter suppression through literacy tests and violence, highlighted by Selma marches', 'The assassination of JFK', 'The formation of the Black Panther Party'], correct: 1, explanation: 'Television coverage of state troopers attacking peaceful marchers at Selma\'s Edmund Pettus Bridge shocked the nation into supporting voting rights legislation.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Selma_to_Montgomery_Marches.jpg/640px-Selma_to_Montgomery_Marches.jpg', caption: 'Selma to Montgomery marches, 1965 (public domain)' } },

            // Topic 8.4
            { topic: '8.4', type: 'multiple_choice', stem: 'The Gulf of Tonkin Resolution (1964) gave the president:', choices: ['Authority to use nuclear weapons', 'Broad authority to escalate American military involvement in Vietnam', 'Power to draft up to 1 million soldiers', 'Control of the CIA'], correct: 1, explanation: 'Based on a disputed naval incident, Congress gave LBJ nearly unlimited authority to escalate in Vietnam — without a formal declaration of war.' },
            { topic: '8.4', type: 'multiple_choice', stem: 'The Tet Offensive (1968) was significant because:', choices: ['It was a major American military victory', 'It showed the war was far from won, turning public opinion against U.S. involvement', 'It ended the war', 'It forced North Vietnam to negotiate'], correct: 1, explanation: 'North Vietnam\'s massive surprise attacks showed Americans that official optimism about the war was not matching reality.' },
            { topic: '8.4', type: 'multiple_choice', stem: 'LBJ\'s Great Society programs included:', choices: ['NATO expansion and military buildup only', 'Medicare, Medicaid, education funding, and civil rights legislation', 'Privatization of Social Security', 'Reduction of federal spending'], correct: 1, explanation: 'The Great Society was the most ambitious domestic program since the New Deal, fundamentally expanding the welfare state.' },

            // Topic 8.5
            { topic: '8.5', type: 'multiple_choice', stem: 'Betty Friedan\'s The Feminine Mystique (1963) argued that:', choices: ['Women should stay home to raise families', 'Middle-class women were unfulfilled by being limited to domestic roles', 'Women were equal to men in the workplace', 'All women should join the workforce'], correct: 1, explanation: 'Friedan identified a widespread dissatisfaction among educated women trapped in domestic roles — sparking second-wave feminism.' },
            { topic: '8.5', type: 'multiple_choice', stem: 'The Stonewall Riot (1969) is significant as:', choices: ['An anti-Vietnam protest', 'The event that launched the modern LGBTQ rights movement', 'A civil rights protest', 'A labor union action'], correct: 1, explanation: 'When police raided the Stonewall Inn, LGBTQ patrons fought back — sparking a movement for gay rights.' },
            { topic: '8.5', type: 'multiple_choice', stem: 'Cesar Chavez led the United Farm Workers to fight for:', choices: ['End to California\'s water rights laws', 'Better conditions and wages for predominantly Latino farmworkers', 'Voting rights in the Southwest', 'Immigration reform only'], correct: 1, explanation: 'Chavez organized farmworkers — among the most exploited workers in America — using strikes and boycotts like the Delano grape boycott.' },

            // Topic 8.6
            { topic: '8.6', type: 'multiple_choice', stem: 'The Watergate scandal forced Nixon to resign because:', choices: ['He lost the 1972 election', 'Evidence showed he participated in covering up the break-in at Democratic headquarters', 'He was found guilty of treason', 'Congress impeached and removed him'], correct: 1, explanation: 'When tapes revealed Nixon\'s direct role in the cover-up, he faced certain impeachment and resigned on August 9, 1974.' },
            { topic: '8.6', type: 'multiple_choice', stem: 'Nixon\'s policy of detente with China and the USSR was significant because:', choices: ['It ended the Cold War immediately', 'It eased Cold War tensions and opened diplomatic/trade relations with communist powers', 'It increased military spending', 'It was rejected by Congress'], correct: 1, explanation: 'Nixon\'s realpolitik approached China and the USSR pragmatically, reducing Cold War tensions and opening economic relations.' },
            { topic: '8.6', type: 'multiple_choice', stem: 'The 1970s "stagflation" referred to:', choices: ['Rapid economic growth with high prices', 'The combination of high inflation and high unemployment — unusual and difficult to fix', 'Stagnant political reforms', 'Environmental regulations that stalled growth'], correct: 1, explanation: 'OPEC oil shocks triggered inflation while the economy stagnated — defying conventional economic models and Carter\'s ability to respond.' },

            // ===== UNIT 9: Period 9, 1980-Present =====
            // Topic 9.1
            { topic: '9.1', type: 'multiple_choice', stem: 'Reagan\'s economic policy ("Reaganomics") was based on:', choices: ['Raising taxes on the wealthy to fund social programs', 'Supply-side economics — cutting taxes (especially on wealthy) to stimulate growth', 'Nationalizing key industries', 'Increasing the minimum wage significantly'], correct: 1, explanation: 'Supply-side theory held that tax cuts for businesses and the wealthy would "trickle down" to all Americans through investment and growth.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Official_Portrait_of_President_Reagan_1981.jpg/480px-Official_Portrait_of_President_Reagan_1981.jpg', caption: 'President Ronald Reagan, official portrait, 1981 (public domain)' } },
            { topic: '9.1', type: 'multiple_choice', stem: 'The Religious Right became politically powerful in the 1980s by opposing:', choices: ['The Cold War', 'Abortion, LGBTQ rights, and advocating traditional Christian values in public life', 'Free trade agreements', 'Reagan\'s tax cuts'], correct: 1, explanation: 'Evangelical Christians organized politically around issues like abortion (Roe v. Wade) and became a crucial Republican constituency.' },
            { topic: '9.1', type: 'multiple_choice', stem: 'Under Reagan, the federal deficit:', choices: ['Was eliminated', 'Was reduced significantly', 'Tripled due to tax cuts and increased military spending', 'Remained the same'], correct: 2, explanation: 'Reagan\'s combination of tax cuts and defense buildup dramatically increased the national debt, from $994 billion to $2.9 trillion.' },

            // Topic 9.2
            { topic: '9.2', type: 'multiple_choice', stem: 'The Berlin Wall fell on:', choices: ['November 9, 1989', 'December 25, 1991', 'January 1, 1990', 'June 5, 1989'], correct: 0, explanation: 'The Berlin Wall fell on November 9, 1989, as East Germany opened its borders — symbolizing the end of the Cold War.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/BerlinWall-Trabant.jpg/640px-BerlinWall-Trabant.jpg', caption: 'Crowds celebrate at the Berlin Wall, November 1989 (public domain)' } },
            { topic: '9.2', type: 'multiple_choice', stem: 'Mikhail Gorbachev\'s reforms — glasnost and perestroika — resulted in:', choices: ['Strengthening Soviet communism', 'Unleashing forces that led to the collapse of the Soviet Union', 'Making the USSR a democracy', 'Military victory in Afghanistan'], correct: 1, explanation: 'Gorbachev\'s opening reforms allowed people to criticize the system; once started, the process of dissolution could not be stopped.' },
            { topic: '9.2', type: 'multiple_choice', stem: 'The Gulf War (1991) was fought to:', choices: ['Destroy Iraq\'s government permanently', 'Liberate Kuwait from Iraqi occupation', 'Seize Iraqi oil fields for the U.S.', 'Prevent Iraq from getting nuclear weapons'], correct: 1, explanation: 'Bush assembled a 34-nation coalition under UN mandate to expel Iraq from Kuwait — a limited, successful military campaign.' },

            // Topic 9.3
            { topic: '9.3', type: 'multiple_choice', stem: 'NAFTA (1994) created a free trade zone between:', choices: ['The U.S. and Western Europe', 'The U.S., Canada, and Mexico', 'All Western hemisphere nations', 'The U.S. and Asian Pacific nations'], correct: 1, explanation: 'The North American Free Trade Agreement eliminated most tariffs between the three nations, increasing trade but also moving jobs.' },
            { topic: '9.3', type: 'multiple_choice', stem: 'Clinton was impeached in 1998 for:', choices: ['Financial corruption', 'Lying under oath and obstruction of justice related to the Lewinsky affair', 'Abuse of military power', 'Violating campaign finance laws'], correct: 1, explanation: 'Clinton was impeached for perjury and obstruction of justice, but the Senate did not convict him and he finished his term.' },
            { topic: '9.3', type: 'multiple_choice', stem: 'The "culture wars" of the 1990s involved conflicts over:', choices: ['Military spending and foreign policy', 'Values and social issues like abortion, LGBTQ rights, immigration, and multiculturalism', 'Economic policy only', 'Environmental regulations'], correct: 1, explanation: 'The 1990s saw intensified battles over social and cultural issues that divided conservatives and liberals.' },

            // Topic 9.4
            { topic: '9.4', type: 'multiple_choice', stem: 'The financial crisis of 2008 was primarily caused by:', choices: ['Government overspending alone', 'Risky subprime mortgage lending combined with deregulated financial instruments and speculation', 'Trade deficits with China', 'High energy prices'], correct: 1, explanation: 'The collapse of the housing bubble, enabled by deregulation and complex mortgage-backed securities, triggered a global financial crisis.' },
            { topic: '9.4', type: 'multiple_choice', stem: 'Deindustrialization in the "Rust Belt" was caused by:', choices: ['Worker strikes only', 'Manufacturing jobs moving overseas due to globalization and automation', 'Environmental regulations', 'Population decline only'], correct: 1, explanation: 'Companies moved factories to countries with lower wages, devastating industrial cities in the Midwest and Northeast.' },
            { topic: '9.4', type: 'multiple_choice', stem: 'The dot-com boom and bust (1995-2001) reflected:', choices: ['Excessive government spending', 'Speculative investment in internet companies that lacked sustainable business models', 'Solid economic fundamentals', 'Real estate speculation'], correct: 1, explanation: 'Investors poured money into internet startups with no clear path to profitability; when the bubble burst, trillions in paper wealth vanished.' },

            // Topic 9.5
            { topic: '9.5', type: 'multiple_choice', stem: 'The September 11, 2001 attacks were carried out by:', choices: ['The Taliban government of Afghanistan', 'Al-Qaeda terrorists led by Osama bin Laden', 'Iraqi government agents', 'Domestic American terrorists'], correct: 1, explanation: '19 al-Qaeda members hijacked four planes; Osama bin Laden claimed responsibility for the attacks.' },
            { topic: '9.5', type: 'multiple_choice', stem: 'The invasion of Iraq (2003) was justified by claims of:', choices: ['Iraqi support for 9/11, which was proven true', 'Iraqi weapons of mass destruction, which were not found', 'Iraqi nuclear weapons program, which existed', 'UN mandate for invasion'], correct: 1, explanation: 'The Bush administration\'s main justification — Iraqi WMD — proved false, severely damaging American credibility.' },
            { topic: '9.5', type: 'multiple_choice', stem: 'The PATRIOT Act (2001) was controversial because it:', choices: ['Increased military spending', 'Expanded government surveillance powers, raising concerns about civil liberties', 'Required military service', 'Restricted immigration from all countries'], correct: 1, explanation: 'The PATRIOT Act allowed broader government surveillance of American citizens, sparking debate about security vs. civil liberties.' },

            // Topic 9.6
            { topic: '9.6', type: 'multiple_choice', stem: 'The Affordable Care Act (2010) primarily aimed to:', choices: ['Create a single-payer healthcare system', 'Expand access to health insurance while maintaining private insurance', 'Privatize Medicare and Medicaid', 'Reduce healthcare spending immediately'], correct: 1, explanation: 'The ACA created health exchanges, expanded Medicaid, and required most Americans to have coverage — reducing uninsured rates significantly.' },
            { topic: '9.6', type: 'multiple_choice', stem: 'The Black Lives Matter movement emerged in response to:', choices: ['Economic inequality only', 'Police killings of Black Americans and systemic racial injustice in the criminal justice system', 'Educational inequality', 'Immigration policy'], correct: 1, explanation: 'BLM arose after the acquittal of Trayvon Martin\'s killer (2013) and grew with each high-profile police killing of Black Americans.' },
            { topic: '9.6', type: 'multiple_choice', stem: 'The January 6, 2021 attack on the U.S. Capitol occurred because:', choices: ['Congress was voting on the budget', 'Supporters of President Trump attempted to stop certification of the 2020 election results', 'Foreign terrorists attacked the government', 'Protesters opposed economic policy'], correct: 1, explanation: 'After Trump\'s election loss, supporters stormed the Capitol in an attempt to prevent Congress from certifying Biden\'s victory.' },

            // ===== ADDITIONAL QUESTIONS =====
            // Unit 1 extras
            { topic: '1.1', type: 'multiple_choice', stem: 'The Mississippian culture (Cahokia) is notable for:', choices: ['Building the first ocean-going vessels in North America', 'Creating large urban centers and elaborate earthen mounds', 'Developing the first writing system in the Americas', 'Establishing trade with China'], correct: 1, explanation: 'Cahokia near present-day St. Louis had 10,000–20,000 residents and massive ceremonial mounds — one of North America\'s largest pre-contact cities.' },
            { topic: '1.1', type: 'multiple_choice', stem: 'Eastern Woodland peoples relied on the "Three Sisters" — crops of:', choices: ['Wheat, barley, and rye', 'Corn, beans, and squash', 'Rice, millet, and sorghum', 'Potatoes, tomatoes, and peppers'], correct: 1, explanation: 'Corn, beans, and squash were grown together; they supported each other and provided a nutritionally complete diet.' },
            { topic: '1.1', type: 'multiple_choice', stem: 'Before European contact, Great Plains peoples were primarily:', choices: ['Nomadic horse-riders exclusively', 'Semi-nomadic farmers and hunter-gatherers', 'Purely agricultural societies', 'Maritime fishing peoples'], correct: 1, explanation: 'Before the introduction of horses, Plains peoples farmed river valleys and hunted on foot — horses arrived in the 17th century.' },

            { topic: '1.2', type: 'multiple_choice', stem: 'The Treaty of Tordesillas (1494) divided the non-Christian world between:', choices: ['England and France', 'Spain and Portugal', 'Spain and the Netherlands', 'Portugal and France'], correct: 1, explanation: 'The Pope brokered the Treaty, giving Spain rights west of a meridian and Portugal rights to the east — including Brazil.' },
            { topic: '1.2', type: 'multiple_choice', stem: 'Ferdinand Magellan\'s expedition (1519–22) was the first to:', choices: ['Reach North America', 'Discover Australia', 'Circumnavigate the globe', 'Find a northern sea route to Asia'], correct: 2, explanation: 'Magellan\'s fleet (he died en route) proved the world was round and much larger than Columbus had imagined.' },
            { topic: '1.2', type: 'multiple_choice', stem: 'John Cabot\'s voyages (1497–98) established the basis for:', choices: ['French claims in Canada', 'England\'s territorial claims in North America', 'Dutch colonization of New York', 'Spanish exploration of Florida'], correct: 1, explanation: 'Cabot sailed for England and landed in Newfoundland/Labrador, giving England its legal claim to North America.' },

            { topic: '1.3', type: 'multiple_choice', stem: 'Spanish conquistadors were primarily motivated by:', choices: ['Scientific exploration', 'Spreading democracy', 'Personal glory and wealth (gold)', 'Escaping religious persecution'], correct: 2, explanation: 'The conquistadors sought encomiendas, gold, and fame — the "3 G\'s" of Gold, Glory, and God.' },
            { topic: '1.3', type: 'multiple_choice', stem: 'The Aztec capital Tenochtitlan, when Cortes arrived, was:', choices: ['A small village of a few thousand', 'Larger than most European cities with 200,000+ residents', 'An uninhabited ceremonial site', 'A military fortress only'], correct: 1, explanation: 'Tenochtitlan\'s sophisticated urban design, markets, and population astonished the Spanish — it dwarfed most European cities.' },
            { topic: '1.3', type: 'multiple_choice', stem: 'The "Black Legend" referred to:', choices: ['Myths about African explorers reaching America first', 'Anti-Spanish propaganda emphasizing extreme cruelty toward Native peoples', 'The legend of El Dorado, the city of gold', 'Spanish exaggerations about Native cannibalism'], correct: 1, explanation: 'Largely based on Las Casas\'s accounts, the "Black Legend" portrayed Spain as uniquely brutal — partly used by rival European powers.' },

            { topic: '1.4', type: 'multiple_choice', stem: 'The caste system (sistema de castas) in Spanish colonies ranked people primarily by:', choices: ['Wealth and land ownership', 'Racial mixture and ancestry', 'Military rank', 'Religious devotion'], correct: 1, explanation: 'The casta system created detailed racial categories (peninsulare, criollo, mestizo, mulato, etc.) that determined legal rights and status.' },
            { topic: '1.4', type: 'multiple_choice', stem: 'Catholic missions in Spanish North America served to:', choices: ['Protect Native autonomy', 'Convert Natives to Christianity and use their labor', 'Create self-governing Native communities', 'Only provide education'], correct: 1, explanation: 'Missions simultaneously served religious, economic, and colonial purposes — converting Natives while putting them to work.' },
            { topic: '1.4', type: 'multiple_choice', stem: 'Mestizos in the Spanish colonial caste system were people of:', choices: ['Pure Spanish ancestry born in the Americas', 'Mixed Spanish and Native American ancestry', 'Mixed African and Spanish ancestry', 'Mixed African and Native ancestry'], correct: 1, explanation: 'Mestizos occupied a middle position in the caste hierarchy — neither at the top nor at the bottom.' },

            { topic: '1.5', type: 'multiple_choice', stem: 'The Dutch colony of New Netherland was primarily:', choices: ['A religious refuge like New England', 'A commercial trading enterprise focused on the fur trade', 'A military base against French Canada', 'A plantation colony using enslaved labor'], correct: 1, explanation: 'The Dutch West India Company established New Netherland as a profit-driven trading venture, not a settlement colony.' },
            { topic: '1.5', type: 'multiple_choice', stem: 'The French relationship with Native Americans differed from the English because France:', choices: ['Enslaved Natives more extensively', 'Generally had fewer settlers and built trade partnerships rather than taking land', 'Converted Natives by force', 'Excluded Natives from trade'], correct: 1, explanation: 'French traders and missionaries often lived among Native peoples and married into communities — creating alliances built on mutual interest.' },
            { topic: '1.5', type: 'multiple_choice', stem: 'England\'s first permanent North American settlement was:', choices: ['Plymouth (1620)', 'Roanoke (1587)', 'Jamestown (1607)', 'Boston (1630)'], correct: 2, explanation: 'Jamestown, founded in 1607 by the Virginia Company, was England\'s first permanent settlement despite enormous early hardship.' },

            { topic: '1.6', type: 'multiple_choice', stem: 'The Columbian Exchange brought which crop from America that dramatically increased population in Africa and Asia?', choices: ['Wheat', 'Rice', 'Corn (maize)', 'Coffee'], correct: 2, explanation: 'Corn spread rapidly across Africa and Asia after 1492, providing high-yield calories that supported population growth.' },
            { topic: '1.6', type: 'multiple_choice', stem: 'European livestock (cattle, pigs, horses) introduced to the Americas:', choices: ['Had no impact on Native peoples', 'Transformed Native diets and cultures, and also spread disease', 'Were quickly rejected by Native peoples', 'Were only used by Spanish settlers'], correct: 1, explanation: 'Pigs and cattle became food sources for some Native groups; horses transformed Plains cultures; all carried diseases that devastated Native populations.' },
            { topic: '1.6', type: 'multiple_choice', stem: 'Sugar production in the Caribbean required massive enslaved labor because:', choices: ['Sugar was difficult to sell', 'Sugar cultivation and processing was brutally labor-intensive', 'European workers refused to go to the Caribbean', 'Sugar only grew in certain soils requiring expert care'], correct: 1, explanation: 'The brutal demands of sugar production drove the Atlantic slave trade — Caribbean sugar plantations had the highest mortality rates.' },

            // Unit 2 extras
            { topic: '2.1', type: 'multiple_choice', stem: 'The headright system in Virginia gave 50 acres of land to:', choices: ['Anyone who served in the militia', 'Anyone who paid for a colonist\'s passage to Virginia', 'Each enslaved person imported', 'The governor to distribute as he chose'], correct: 1, explanation: 'The headright system incentivized wealthy colonists to import workers — eventually contributing to both indentured servitude and slavery.' },
            { topic: '2.1', type: 'multiple_choice', stem: 'The Virginia House of Burgesses (1619) was significant as:', choices: ['The first colonial newspaper', 'The first representative legislative assembly in English America', 'The first court to try criminal cases', 'The first colonial army'], correct: 1, explanation: 'The House of Burgesses established the tradition of representative self-government that colonists would later fight to protect.' },
            { topic: '2.1', type: 'multiple_choice', stem: 'South Carolina\'s plantation economy differed from Virginia\'s by relying primarily on:', choices: ['Tobacco', 'Cotton', 'Rice cultivation, using knowledge from enslaved West Africans', 'Wheat and grain'], correct: 2, explanation: 'Enslaved Africans from rice-growing regions brought the expertise to cultivate rice in South Carolina\'s swampy lowlands.' },

            { topic: '2.2', type: 'multiple_choice', stem: 'Anne Hutchinson was banished from Massachusetts Bay Colony for:', choices: ['Refusing to pay taxes', 'Holding religious meetings and challenging Puritan orthodoxy', 'Sympathizing with Native peoples', 'Leading an armed rebellion'], correct: 1, explanation: 'Hutchinson\'s meetings — where she critiqued ministers — threatened Puritan authority; she was tried, banished, and later killed in a Native attack.' },
            { topic: '2.2', type: 'multiple_choice', stem: 'The Salem Witch Trials (1692) reflected:', choices: ['Real witchcraft practices in Massachusetts', 'Social tensions, religious anxiety, and mass hysteria in Puritan society', 'A political plot by the governor', 'Conflict between Puritans and Native Americans'], correct: 1, explanation: 'Historians see Salem as a product of community tensions, religious fears, and possibly ergot poisoning — not real witchcraft.' },
            { topic: '2.2', type: 'multiple_choice', stem: 'Connecticut\'s Fundamental Orders (1639) is considered significant because it was:', choices: ['The first colonial charter to mention God', 'One of the first written constitutions establishing representative government', 'The first document to mention natural rights', 'The first colonial law code'], correct: 1, explanation: 'The Fundamental Orders created a government based on the will of the free men — an early model for constitutional government.' },

            { topic: '2.3', type: 'multiple_choice', stem: 'New York was originally a Dutch colony called:', choices: ['Nova Britannia', 'New Nederlandia', 'New Netherland, with New Amsterdam as its capital', 'New Holland'], correct: 2, explanation: 'The Dutch established New Netherland in 1624; England seized it in 1664 and renamed it New York for the Duke of York.' },
            { topic: '2.3', type: 'multiple_choice', stem: 'Georgia (1733) was founded with the unusual purpose of:', choices: ['A tobacco colony', 'A haven for persecuted Catholics', 'Providing a buffer against Spanish Florida and a fresh start for English debtors', 'A Quaker religious experiment'], correct: 2, explanation: 'James Oglethorpe envisioned Georgia as a military buffer and a place where English debtors could rebuild — though the debtor colony plan faded quickly.' },
            { topic: '2.3', type: 'multiple_choice', stem: 'The Middle Colonies were economically distinctive because they:', choices: ['Relied entirely on plantation agriculture', 'Had the most diverse economies — farming, trade, crafts, and small manufacturing', 'Focused exclusively on the fur trade', 'Depended on fishing like New England'], correct: 1, explanation: 'New York, Pennsylvania, New Jersey, and Delaware had more varied economies than either plantation South or Puritan New England.' },

            { topic: '2.4', type: 'multiple_choice', stem: 'The Triangle Trade connected:', choices: ['England, France, and Spain', 'New England, West Africa, and the Caribbean/Southern colonies', 'The Caribbean, Brazil, and Portugal', 'Virginia, New York, and England only'], correct: 1, explanation: 'Ships carried goods from New England to Africa (for enslaved people), enslaved people to the Caribbean (for sugar), and sugar/molasses back to New England.' },
            { topic: '2.4', type: 'multiple_choice', stem: 'John Peter Zenger\'s trial (1735) established the principle that:', choices: ['Newspapers could be taxed by the Crown', 'Truth was a valid defense against libel — a foundation of press freedom', 'Colonial courts had no jurisdiction over printers', 'The governor controlled all publishing'], correct: 1, explanation: 'Zenger\'s acquittal established that accurate criticism of government officials could not be prosecuted as libel.' },
            { topic: '2.4', type: 'multiple_choice', stem: 'Colonial assemblies gained power over time mainly by:', choices: ['Armed rebellion against governors', 'Controlling the budget — the "power of the purse"', 'Appointing their own judges', 'Forming militias'], correct: 1, explanation: 'By controlling appropriations, colonial assemblies could withhold the governor\'s salary — gaining leverage over royal appointees.' },

            { topic: '2.5', type: 'multiple_choice', stem: 'Enslaved people from West Africa brought important knowledge that shaped:', choices: ['Puritan religious practices', 'Rice cultivation in South Carolina and cattle herding in the Carolinas', 'New England\'s fishing industry', 'Virginia\'s tobacco processing'], correct: 1, explanation: 'West Africans from rice-growing regions carried crucial agricultural expertise — their enslaved labor AND knowledge built the Carolina rice economy.' },
            { topic: '2.5', type: 'multiple_choice', stem: 'By 1750, which colony had the highest percentage of enslaved people in its population?', choices: ['Virginia', 'Maryland', 'South Carolina', 'Georgia'], correct: 2, explanation: 'South Carolina\'s plantation economy made it the colony most dependent on enslaved labor — enslaved people were a majority of the population.' },
            { topic: '2.5', type: 'multiple_choice', stem: 'Enslaved Africans in the colonial South developed distinct cultural traditions by:', choices: ['Abandoning all African customs', 'Blending African and American elements (like the Gullah culture of coastal Carolina)', 'Following European cultural models exactly', 'Maintaining completely separate African traditions unchanged'], correct: 1, explanation: 'Gullah, creole languages, music, and spiritual practices show how enslaved people created new cultures drawing on African roots.' },

            { topic: '2.6', type: 'multiple_choice', stem: 'The Covenant Chain was:', choices: ['A form of indentured servitude', 'A diplomatic alliance between the Iroquois Confederacy and English colonies', 'A trade agreement between colonies', 'A religious covenant among Puritan colonists'], correct: 1, explanation: 'The Covenant Chain was a series of diplomatic agreements that linked the Iroquois and English in a mutually beneficial alliance.' },
            { topic: '2.6', type: 'multiple_choice', stem: 'By the mid-18th century, Native American power in the East was greatly reduced by:', choices: ['Voluntary migration to the West', 'Disease, warfare, and loss of land to European colonists', 'Peaceful assimilation into European culture', 'Military defeat by one major battle'], correct: 1, explanation: 'Decades of epidemic disease, land purchases and seizures, and wars had drastically reduced Eastern Native populations and territory.' },
            { topic: '2.6', type: 'multiple_choice', stem: 'The fur trade affected Native peoples by:', choices: ['Increasing their independence from Europeans', 'Creating economic dependency on European goods while causing environmental destruction', 'Providing a stable income without disrupting traditional life', 'Only benefiting Native peoples economically'], correct: 1, explanation: 'Trade for metal tools and guns created dependency; overhunting depleted beaver populations; and European alliance requirements drew Natives into colonial wars.' },

            // Unit 3 extras
            { topic: '3.1', type: 'multiple_choice', stem: 'The Albany Plan of Union (1754) proposed:', choices: ['Independence from Britain', 'A united colonial government for common defense — rejected by both colonies and the Crown', 'A military alliance with France', 'An economic union among Northern colonies'], correct: 1, explanation: 'Franklin\'s Albany Plan was too centralizing for the colonies and too representative for Britain — but foreshadowed later union.' },
            { topic: '3.1', type: 'multiple_choice', stem: 'Pontiac\'s Rebellion (1763) was a Native American response to:', choices: ['The French and Indian War beginning', 'British takeover of former French territories and settler encroachment on Native land', 'The Stamp Act', 'Colonial expansion into New England'], correct: 1, explanation: 'After Britain took over French posts, it cut off gift-giving diplomacy that Natives relied on; Pontiac united tribes to attack British forts.' },
            { topic: '3.1', type: 'multiple_choice', stem: 'The Treaty of Paris (1763) resulted in France:', choices: ['Gaining Canada from Britain', 'Losing virtually all of its North American empire', 'Gaining Florida from Spain', 'Sharing the Mississippi Valley with Britain'], correct: 1, explanation: 'France ceded Canada and territory east of the Mississippi to Britain, and Louisiana west of the Mississippi to Spain.' },

            { topic: '3.2', type: 'multiple_choice', stem: 'The Stamp Act Congress (1765) was historically significant because:', choices: ['It declared independence from Britain', 'It was the first intercolonial meeting to formally protest British policy', 'It created the Continental Army', 'It established the first colonial court system'], correct: 1, explanation: 'Nine colonies sent delegates — the first time colonies cooperated to formally challenge British authority.' },
            { topic: '3.2', type: 'multiple_choice', stem: 'The Boston Massacre (1770) killed five colonists, and Paul Revere\'s engraving of it was used to:', choices: ['Accurately report a riot that colonists started', 'Serve as anti-British propaganda, depicting a deliberate massacre', 'Show British restraint toward colonists', 'Discourage further protests'], correct: 1, explanation: 'Revere\'s engraving (actually copied from Henry Pelham) deliberately depicted British soldiers firing on peaceful citizens — effective propaganda.' },
            { topic: '3.2', type: 'multiple_choice', stem: 'Daughters of Liberty contributed to colonial resistance by:', choices: ['Fighting in militias', 'Organizing boycotts of British goods and producing homespun cloth', 'Writing political pamphlets', 'Serving as spies in Boston'], correct: 1, explanation: 'Women were critical to the boycott movement — spinning their own cloth instead of buying British textiles was a major political act.' },

            { topic: '3.3', type: 'multiple_choice', stem: 'Valley Forge (winter 1777–78) was significant because the Continental Army:', choices: ['Won a major battle there', 'Suffered terrible hardship but emerged with better discipline under Baron von Steuben', 'Was completely defeated by the British', 'Mutinied against Washington'], correct: 1, explanation: 'Despite starvation and freezing temperatures, Washington\'s army survived; Prussian drillmaster von Steuben transformed them into a professional force.' },
            { topic: '3.3', type: 'multiple_choice', stem: 'African Americans who fought for Britain during the Revolution were often promised:', choices: ['Land in Canada', 'Freedom from slavery in exchange for military service', 'Citizenship in Britain', 'Return to Africa'], correct: 1, explanation: 'Lord Dunmore\'s Proclamation (1775) promised freedom to enslaved men who joined British forces — about 20,000 accepted.' },
            { topic: '3.3', type: 'multiple_choice', stem: 'The main weakness of the Continental Army during the Revolution was:', choices: ['Lack of military leadership', 'Chronic shortages of men, food, equipment, and money', 'Poor strategy by Washington', 'Lack of public support'], correct: 1, explanation: 'Short enlistments, desertion, and lack of supplies plagued Washington\'s army throughout the war.' },

            { topic: '3.4', type: 'multiple_choice', stem: 'The Land Ordinance of 1785 was significant because it created:', choices: ['The first national currency', 'A systematic method for surveying and selling Western lands', 'The framework for territorial government', 'The first public school system'], correct: 1, explanation: 'The township-and-range survey system created by the Land Ordinance is still visible in the rectangular land patterns of the Midwest.' },
            { topic: '3.4', type: 'multiple_choice', stem: 'One genuine success of the Articles of Confederation was:', choices: ['Maintaining a stable currency', 'Organizing the Northwest Territory via the Northwest Ordinance', 'Paying off the Revolutionary War debt', 'Negotiating strong trade treaties'], correct: 1, explanation: 'The Northwest Ordinance was a landmark achievement — organizing the territory into states and banning slavery there.' },
            { topic: '3.4', type: 'multiple_choice', stem: 'James Madison is called the "Father of the Constitution" because:', choices: ['He presided over the Constitutional Convention', 'He drafted the Virginia Plan and kept the most complete records of the debates', 'He wrote the final document', 'He was the oldest delegate'], correct: 1, explanation: 'Madison\'s Virginia Plan shaped the entire convention\'s agenda, and his detailed notes are our best source for what happened.' },

            { topic: '3.5', type: 'multiple_choice', stem: 'Checks and balances in the Constitution means:', choices: ['Congress approves the federal budget', 'Each branch of government has power to limit the actions of the others', 'The President controls foreign policy alone', 'States can override federal law'], correct: 1, explanation: 'Each branch has tools to check the others: Congress can override vetoes, the President can veto, courts can strike down laws.' },
            { topic: '3.5', type: 'multiple_choice', stem: 'The Bill of Rights was added to the Constitution primarily to:', choices: ['Strengthen the federal government', 'Satisfy Anti-Federalists who demanded specific protections for individual rights', 'Replace the Articles of Confederation', 'Define the powers of the president'], correct: 1, explanation: 'Anti-Federalists refused to ratify without a bill of rights; the first ten amendments were ratified in 1791.' },
            { topic: '3.5', type: 'multiple_choice', stem: 'The Connecticut (Great) Compromise resolved conflict over representation by creating:', choices: ['A single legislative chamber based on population', 'A bicameral Congress with population-based House and equal-state Senate', 'A council of state governors', 'A legislature chosen by lottery'], correct: 1, explanation: 'Small states wanted equal representation; large states wanted population-based. The compromise gave them both.' },

            { topic: '3.6', type: 'multiple_choice', stem: 'Washington\'s Farewell Address (1796) warned future presidents against:', choices: ['Building a navy', 'Permanent alliances with foreign nations and the dangers of political factions', 'Expanding westward', 'Allowing immigration'], correct: 1, explanation: 'Washington\'s warnings against "entangling alliances" and partisanship shaped American foreign policy for over a century.' },
            { topic: '3.6', type: 'multiple_choice', stem: 'The Alien and Sedition Acts (1798) were controversial because they:', choices: ['Taxed foreign goods', 'Targeted political opponents — mainly Republican immigrants and newspapers', 'Banned immigration entirely', 'Established martial law'], correct: 1, explanation: 'The Acts made it illegal to criticize the government; Jefferson and Madison responded with the Kentucky and Virginia Resolutions.' },
            { topic: '3.6', type: 'multiple_choice', stem: 'Hamilton\'s financial program assumed state debts in order to:', choices: ['Help poor states', 'Bind wealthy creditors to the success of the new federal government', 'Reduce the national debt quickly', 'Gain Southern support for his program'], correct: 1, explanation: 'If wealthy investors held federal bonds instead of state bonds, they had a personal financial stake in making the federal government succeed.' },

            // Unit 4 extras
            { topic: '4.1', type: 'multiple_choice', stem: 'McCulloch v. Maryland (1819) ruled that states could not tax the federal bank because:', choices: ['Banks were private property', 'The power to tax implies the power to destroy — states cannot destroy federal institutions', 'Congress had not authorized state taxation', 'Only Congress could create taxes'], correct: 1, explanation: 'Marshall\'s ruling established federal supremacy and the doctrine of implied powers — the bank was constitutional under the "necessary and proper" clause.' },
            { topic: '4.1', type: 'multiple_choice', stem: 'The Monroe Doctrine (1823) was significant because it:', choices: ['Allied the U.S. with Britain against Spain', 'Declared the Western Hemisphere closed to further European colonization', 'Committed the U.S. to defending Latin American democracies', 'Established the U.S. Navy as the dominant force in the Atlantic'], correct: 1, explanation: 'Monroe\'s declaration that the Western Hemisphere was off-limits to European colonization became a cornerstone of U.S. foreign policy.' },
            { topic: '4.1', type: 'multiple_choice', stem: 'Gibbons v. Ogden (1824) established that:', choices: ['States could regulate interstate waterways', 'Congress had broad power to regulate interstate commerce', 'Monopolies were unconstitutional', 'State courts had final say on commerce disputes'], correct: 1, explanation: 'Marshall ruled that only Congress — not states — could regulate commerce between states, broadly defining federal commerce power.' },

            { topic: '4.2', type: 'multiple_choice', stem: 'The Lowell Mills were notable for employing:', choices: ['Only recent immigrants', 'Young, single women from New England farm families', 'Primarily child laborers', 'Only skilled male craftsmen'], correct: 1, explanation: 'The "Lowell Girls" were New England farm daughters who worked in factories before marriage — an early American industrial workforce.' },
            { topic: '4.2', type: 'multiple_choice', stem: 'Eli Whitney\'s cotton gin (1793) paradoxically:', choices: ['Made slavery unnecessary', 'Made cotton so profitable that slavery expanded dramatically', 'Was quickly replaced by better technology', 'Reduced Southern cotton production'], correct: 1, explanation: 'By making cotton processing cheap, the gin made short-staple cotton highly profitable across the South — massively increasing demand for enslaved labor.' },
            { topic: '4.2', type: 'multiple_choice', stem: 'The "putting-out" system in early American industry meant:', choices: ['Factory owners putting out fires in mills', 'Merchants distributing raw materials to home workers and collecting finished goods', 'Workers being laid off seasonally', 'Employers removing inefficient workers'], correct: 1, explanation: 'Before centralized factories, merchants gave out materials to rural families who worked at home — an early stage of industrialization.' },

            { topic: '4.3', type: 'multiple_choice', stem: 'The "corrupt bargain" of 1824 alleged that:', choices: ['Jackson had bribed electors', 'Henry Clay threw his support to John Quincy Adams in exchange for becoming Secretary of State', 'Adams had stolen electoral votes from Crawford', 'Jackson had paid Southern states to support him'], correct: 1, explanation: 'Jackson won the popular vote but the House chose Adams; when Clay (who helped Adams) became Secretary of State, Jackson\'s supporters cried foul.' },
            { topic: '4.3', type: 'multiple_choice', stem: 'The Jacksonian era expanded democracy by:', choices: ['Giving all adults the right to vote', 'Extending voting rights to nearly all white men, eliminating property requirements', 'Including women in the political process', 'Granting citizenship to free Black men'], correct: 1, explanation: 'By the 1830s, most states had dropped property requirements for white male voters — dramatically expanding the electorate.' },
            { topic: '4.3', type: 'multiple_choice', stem: 'The Whig Party was formed in opposition to:', choices: ['Slavery', 'Andrew Jackson\'s use of presidential power, which they compared to a "king"', 'The Bank of the United States', 'Western expansion'], correct: 1, explanation: 'Whigs took their name from the English Whigs who opposed royal tyranny — portraying Jackson as "King Andrew I."' },

            { topic: '4.4', type: 'multiple_choice', stem: 'The Oregon Trail brought settlers to:', choices: ['Texas', 'California', 'The Pacific Northwest (Oregon and Washington)', 'Colorado and Utah'], correct: 2, explanation: 'Beginning in the 1840s, hundreds of thousands of Americans followed the 2,000-mile Oregon Trail to the fertile Willamette Valley.' },
            { topic: '4.4', type: 'multiple_choice', stem: 'The Wilmot Proviso (1846) proposed:', choices: ['Annexing all of Mexico', 'Banning slavery from any territory acquired from Mexico', 'Allowing Mexico to keep California', 'A compromise on the Texas border'], correct: 1, explanation: 'The Proviso passed the House but failed in the Senate — revealing the deep sectional split over slavery\'s expansion.' },
            { topic: '4.4', type: 'multiple_choice', stem: 'Texas was annexed by the United States in 1845 after nearly a decade as:', choices: ['A Mexican state', 'A British colony', 'The independent Republic of Texas', 'A Spanish protectorate'], correct: 2, explanation: 'Texas declared independence from Mexico in 1836 and existed as an independent republic until U.S. annexation in 1845.' },

            { topic: '4.5', type: 'multiple_choice', stem: 'The Underground Railroad was:', choices: ['An actual underground tunnel system', 'A network of safe houses and routes helping enslaved people escape to freedom', 'A railroad funded by abolitionists', 'A secret abolitionist newspaper'], correct: 1, explanation: 'The Underground Railroad was a loose network of antislavery activists who hid and guided freedom seekers northward.' },
            { topic: '4.5', type: 'multiple_choice', stem: 'Harriet Beecher Stowe\'s Uncle Tom\'s Cabin (1852) was significant because it:', choices: ['Was a factual account of slavery', 'Turned many Northerners against slavery by humanizing enslaved people', 'Was banned throughout the United States', 'Was written by an enslaved person'], correct: 1, explanation: 'Lincoln reportedly called Stowe "the little woman who wrote the book that started this great war" — its emotional impact was enormous.' },
            { topic: '4.5', type: 'multiple_choice', stem: 'Horace Mann\'s education reforms in Massachusetts created:', choices: ['The first university in America', 'A model public school system with professional teachers and standard curriculum', 'The first school for enslaved people', 'Private academies for the wealthy'], correct: 1, explanation: 'Mann\'s public school reforms in Massachusetts — normal schools for teacher training, longer school year — became a national model.' },

            { topic: '4.6', type: 'multiple_choice', stem: 'Transcendentalism, led by Emerson and Thoreau, emphasized:', choices: ['Industrial progress and capitalism', 'Individualism, nature, and the spiritual over the material world', 'Strict Biblical literalism', 'Political reform through voting'], correct: 1, explanation: 'Transcendentalists believed individuals could transcend material reality through connection with nature and inner spiritual life.' },
            { topic: '4.6', type: 'multiple_choice', stem: 'Henry David Thoreau\'s "Civil Disobedience" argued that:', choices: ['Citizens must always obey the law', 'Individuals have a moral duty to disobey unjust laws', 'Violence is justified to end slavery', 'Government should be abolished'], correct: 1, explanation: 'Thoreau\'s essay — written after his arrest for refusing to pay taxes supporting the Mexican War — influenced Gandhi and MLK.' },
            { topic: '4.6', type: 'multiple_choice', stem: 'Utopian communities like Brook Farm were attempts to:', choices: ['Create a new form of capitalism', 'Build ideal societies based on shared labor, equality, and high ideals', 'Establish religious theocracies', 'Practice communism based on European models'], correct: 1, explanation: 'Dozens of utopian communities formed in the 1830s–40s, experimenting with cooperative living — most failed within years.' },

            // Unit 5 extras
            { topic: '5.1', type: 'multiple_choice', stem: 'The Lincoln-Douglas debates (1858) focused primarily on:', choices: ['Trade and tariff policy', 'Slavery\'s expansion into territories and the meaning of popular sovereignty', 'States\' rights and nullification', 'Immigration policy'], correct: 1, explanation: 'The seven debates made Lincoln nationally known and defined the Republican position against slavery\'s expansion.' },
            { topic: '5.1', type: 'multiple_choice', stem: 'Northern "free soilers" opposed slavery\'s expansion primarily because:', choices: ['They believed slavery was morally wrong', 'They wanted Western territories for free white labor, not slave competition', 'They wanted to free enslaved people immediately', 'They feared Southern political dominance only'], correct: 1, explanation: 'Many free soilers were not abolitionists — they opposed slavery in the West because they wanted free white farmers to prosper without competing with enslaved labor.' },
            { topic: '5.1', type: 'multiple_choice', stem: 'The "gag rule" (1836–1844) in Congress prevented:', choices: ['Discussion of tariff legislation', 'Any debate on antislavery petitions, violating First Amendment rights according to critics', 'Southern states from seceding', 'Direct election of senators'], correct: 1, explanation: 'The gag rule automatically tabled antislavery petitions; John Quincy Adams spent years fighting it until it was finally repealed.' },

            { topic: '5.2', type: 'multiple_choice', stem: 'Confederate Vice President Alexander Stephens stated the Confederacy\'s "cornerstone" was:', choices: ['States\' rights and local governance', 'The great truth of racial inequality and the institution of slavery', 'Free trade and agricultural prosperity', 'Limited government and individual liberty'], correct: 1, explanation: 'Stephens\'s "Cornerstone Speech" (1861) explicitly stated the Confederacy was founded on the premise that racial slavery was the natural condition.' },
            { topic: '5.2', type: 'multiple_choice', stem: 'The firing on Fort Sumter (April 1861) was significant because:', choices: ['It was the war\'s bloodiest battle', 'It gave Lincoln justification to call for troops, uniting the North and starting the war', 'It was a Confederate defeat', 'It triggered European intervention'], correct: 1, explanation: 'By attacking Fort Sumter, the Confederacy gave Lincoln the political justification to mobilize 75,000 Union troops.' },
            { topic: '5.2', type: 'multiple_choice', stem: 'The election of 1860 was unique because Lincoln:', choices: ['Won despite no electoral votes from slave states', 'Was not on the ballot in most Southern states and won with only Northern electoral votes', 'Won with a large popular vote majority nationwide', 'Ran as a Democrat in the South'], correct: 1, explanation: 'Lincoln wasn\'t even on the ballot in most Southern states — Southern secession began before he even took office.' },

            { topic: '5.3', type: 'multiple_choice', stem: 'The Union\'s Anaconda Plan aimed to win by:', choices: ['One massive frontal assault on Richmond', 'Blockading Southern ports, controlling the Mississippi, and strangling the Confederacy economically', 'Capturing and holding all Southern cities', 'Arming enslaved people immediately'], correct: 1, explanation: 'General Winfield Scott\'s strategy treated the Confederacy like a body to be squeezed — cutting off supplies and splitting territory.' },
            { topic: '5.3', type: 'multiple_choice', stem: 'African American soldiers (USCT) in the Union Army:', choices: ['Were kept out of all combat roles', 'Numbered about 180,000 and fought in many engagements, proving their valor', 'Were paid equally to white soldiers', 'Were only used after 1864'], correct: 1, explanation: 'USCT (United States Colored Troops) made up about 10% of the Union Army; they were paid less than white soldiers and faced execution if captured.' },
            { topic: '5.3', type: 'multiple_choice', stem: 'The Battle of Antietam (1862) was significant because:', choices: ['It was the first major Confederate victory', 'It was the bloodiest single day of the war and gave Lincoln a victory to issue the Emancipation Proclamation', 'It ended the war in the East', 'It was the first use of ironclad ships'], correct: 1, explanation: 'With 23,000 casualties in one day, Antietam\'s "victory" (Lee retreated) gave Lincoln the moment he needed to announce emancipation.' },

            { topic: '5.4', type: 'multiple_choice', stem: 'The 13th Amendment (1865) was significant because it:', choices: ['Gave Black men the right to vote', 'Permanently abolished slavery throughout the United States', 'Guaranteed equal protection under the law', 'Defined citizenship broadly'], correct: 1, explanation: 'The 13th Amendment completed what the Emancipation Proclamation started — permanently ending slavery with no exceptions.' },
            { topic: '5.4', type: 'multiple_choice', stem: 'Lincoln\'s primary stated goal at the start of the Civil War was:', choices: ['Abolishing slavery immediately', 'Preserving the Union — slavery was secondary to saving the country', 'Punishing the South for secession', 'Giving land to freed enslaved people'], correct: 1, explanation: 'Lincoln famously wrote: "If I could save the Union without freeing any slave I would do it" — the war\'s purpose evolved over time.' },
            { topic: '5.4', type: 'multiple_choice', stem: 'Enslaved people who escaped to Union lines during the war were classified as "contraband" because:', choices: ['They had stolen goods from their enslavers', 'Union commanders declared them enemy property seized in war, avoiding the slavery question legally', 'They were considered property of the U.S. government', 'It was a term of respect used by Union soldiers'], correct: 1, explanation: 'General Butler\'s clever legal argument — that escaped enslaved people were enemy war material — let the Union keep them without officially freeing them.' },

            { topic: '5.5', type: 'multiple_choice', stem: 'Black Codes passed by Southern states after the war were intended to:', choices: ['Protect the rights of freed people', 'Restrict freed people\'s movement, labor, and rights to recreate conditions similar to slavery', 'Encourage Black Southerners to migrate North', 'Follow federal Reconstruction guidelines'], correct: 1, explanation: 'Black Codes required Black people to sign annual labor contracts, banned them from certain occupations, and allowed arrest for "vagrancy" — reestablishing forced labor.' },
            { topic: '5.5', type: 'multiple_choice', stem: 'Radical Republicans in Congress wanted Reconstruction to include:', choices: ['Quick restoration of Southern states with no conditions', 'Protection of Black civil rights, redistribution of land, and punishment of Confederate leaders', 'Military occupation of the South indefinitely', 'Colonization of freed people in Africa'], correct: 1, explanation: 'Radicals like Thaddeus Stevens and Charles Sumner wanted to transform the South — not just restore it.' },
            { topic: '5.5', type: 'multiple_choice', stem: 'The 15th Amendment (1870) prohibited:', choices: ['Slavery in the territories', 'Poll taxes', 'Denying the right to vote based on race, color, or previous servitude', 'Racial discrimination in all public places'], correct: 2, explanation: 'The 15th gave Black men the formal right to vote — though literacy tests, poll taxes, and violence would suppress it for nearly a century.' },

            { topic: '5.6', type: 'multiple_choice', stem: 'The Ku Klux Klan was founded in 1865 to:', choices: ['Preserve Confederate military traditions', 'Use terrorism — murder, beatings, burnings — to intimidate Black Southerners and Republicans', 'Organize veterans\' benefits', 'Preserve Southern culture through education'], correct: 1, explanation: 'The KKK was a terrorist organization that murdered thousands to suppress Black political participation and restore white supremacy.' },
            { topic: '5.6', type: 'multiple_choice', stem: 'The crop-lien system trapped Southern farmers because:', choices: ['It was a fair market system that farmers chose freely', 'Merchants gave credit secured by future crops — trapping farmers in perpetual debt cycles', 'It prevented any Black landownership', 'Federal law required it in Reconstruction states'], correct: 1, explanation: 'With no cash, farmers borrowed against their crops at high interest; a bad harvest meant deeper debt, trapping families for generations.' },
            { topic: '5.6', type: 'multiple_choice', stem: 'Poll taxes and literacy tests as voting requirements were used to:', choices: ['Ensure educated voters', 'Disenfranchise Black Southerners (and poor whites) despite the 15th Amendment\'s guarantees', 'Comply with federal law', 'Improve democracy by screening voters'], correct: 1, explanation: 'These mechanisms — along with violence and grandfather clauses — effectively stripped Black Southerners of the vote for nearly a century.' },

            // Unit 6 extras
            { topic: '6.1', type: 'multiple_choice', stem: 'The Bessemer process was significant because it made:', choices: ['Cheap iron production possible', 'Large-scale cheap steel production possible, enabling railroads and skyscrapers', 'Electricity available to factories', 'Cotton processing more efficient'], correct: 1, explanation: 'Cheap steel transformed American industry — railroads, bridges, skyscrapers, and machines all depended on it.' },
            { topic: '6.1', type: 'multiple_choice', stem: 'The Interstate Commerce Act (1887) was passed to:', choices: ['Regulate banking', 'Control railroad rates and practices through the first federal regulatory agency', 'Limit immigration', 'Control the oil industry'], correct: 1, explanation: 'The ICC was the first federal regulatory agency — though initially weak, it established the principle that government could regulate private business.' },
            { topic: '6.1', type: 'multiple_choice', stem: 'Thomas Edison\'s Menlo Park laboratory pioneered:', choices: ['The assembly line', 'Systematic industrial research — inventing as a business process', 'The Bessemer steel process', 'Wireless telegraphy'], correct: 1, explanation: 'Edison\'s "invention factory" turned research into a systematic industrial process — producing the phonograph, electric light, and much more.' },

            { topic: '6.2', type: 'multiple_choice', stem: 'A "trust" in the Gilded Age sense allowed:', choices: ['Workers to form unions', 'Multiple corporations to be controlled by a single board of trustees, eliminating competition', 'Consumers to trust product quality', 'Banks to hold deposits'], correct: 1, explanation: 'Trusts placed competing companies under one board\'s control — in practice creating monopolies while technically maintaining separate companies.' },
            { topic: '6.2', type: 'multiple_choice', stem: 'Social Darwinism applied to Gilded Age business argued that:', choices: ['Workers deserved higher wages because labor created all value', 'Economic competition was natural selection — the strongest businesses deserved to win', 'Government should control monopolies', 'Wealth should be distributed equally'], correct: 1, explanation: 'Applying Darwin\'s "survival of the fittest" to economics, Social Darwinists like Herbert Spencer argued that helping the poor was against nature.' },
            { topic: '6.2', type: 'multiple_choice', stem: 'The Homestead Act (1862) encouraged settlement by:', choices: ['Giving all veterans 160 acres', 'Granting 160 acres of public land to settlers who farmed it for five years', 'Selling Western land at low prices only to corporations', 'Reserving land for railroad companies'], correct: 1, explanation: 'The Homestead Act opened the Great Plains to family farming — though railroads and speculators got much of the best land.' },

            { topic: '6.3', type: 'multiple_choice', stem: 'The Haymarket Riot (1886) damaged the labor movement because:', choices: ['Workers killed many factory owners', 'A bombing killed police at a labor rally, turning public opinion against unions', 'Strikers burned down major factories', 'The government banned all unions after it'], correct: 1, explanation: 'Though labor leaders were almost certainly not responsible for the bomb, the Haymarket affair associated unions with radicalism and anarchism.' },
            { topic: '6.3', type: 'multiple_choice', stem: 'The Pullman Strike (1894) ended when:', choices: ['Workers won better wages and housing terms', 'President Cleveland sent federal troops over the Illinois governor\'s objection, crushing the strike', 'J.P. Morgan brokered a settlement', 'The Supreme Court ruled in workers\' favor'], correct: 1, explanation: 'Cleveland used the injunction against the strike (claiming it disrupted mail delivery) and sent troops — setting a precedent for using federal power against labor.' },
            { topic: '6.3', type: 'multiple_choice', stem: 'Samuel Gompers\' AFL focused on "bread and butter" issues because:', choices: ['He was a baker\'s union leader', 'He believed pragmatic wage-and-hours demands were more achievable than revolutionary politics', 'He opposed all political involvement', 'He only wanted to represent bakers and food workers'], correct: 1, explanation: 'Unlike the Knights of Labor, Gompers\' AFL won concrete gains for skilled workers by focusing on wages, hours, and conditions rather than socialist ideology.' },

            { topic: '6.4', type: 'multiple_choice', stem: 'Ida B. Wells is best remembered for:', choices: ['Founding the NAACP alone', 'Documenting and campaigning against lynching as a tool of racial terror', 'Writing the first Black newspaper in America', 'Leading the Montgomery Bus Boycott'], correct: 1, explanation: 'Wells\'s investigations showed that lynching was not about crime but about maintaining white supremacy — her journalism was groundbreaking and dangerous.' },
            { topic: '6.4', type: 'multiple_choice', stem: 'The Chinese Exclusion Act (1882) was notable because:', choices: ['It restricted all Asian immigration', 'It was the only U.S. law to ban immigration by a specific nationality', 'It was quickly repealed by Congress', 'It only applied to Chinese laborers in California'], correct: 1, explanation: 'The Act, which was not repealed until 1943, banned Chinese laborers from immigrating — the first major federal restriction on a specific ethnic group.' },
            { topic: '6.4', type: 'multiple_choice', stem: 'W.E.B. Du Bois co-founded the NAACP in 1909 to:', choices: ['Support industrial education for Black Americans', 'Fight for full civil and political rights through legal action and advocacy', 'Promote Black emigration to Africa', 'Oppose Booker T. Washington\'s educational programs'], correct: 1, explanation: 'The NAACP pursued legal challenges to segregation and discrimination — a strategy that would eventually lead to Brown v. Board of Education.' },

            { topic: '6.5', type: 'multiple_choice', stem: 'The "closing of the frontier" was declared by historian Frederick Jackson Turner in 1893 who argued:', choices: ['All good Western land had been sold', 'The frontier had shaped American democracy and its end was a defining moment', 'Native Americans had been fully assimilated', 'Western settlement was economically a failure'], correct: 1, explanation: 'Turner\'s "Frontier Thesis" argued that the frontier experience had created American individualism and democracy — its closing raised questions about America\'s future.' },
            { topic: '6.5', type: 'multiple_choice', stem: 'The Wounded Knee Massacre (1890) killed approximately 250 Lakota people and:', choices: ['Led to a major Native military victory', 'Effectively ended armed Native American resistance on the Great Plains', 'Caused Congress to apologize formally to Native peoples', 'Was the start of the Indian Wars'], correct: 1, explanation: 'Wounded Knee, where the 7th Cavalry killed men, women, and children, marked the end of the Plains Indian Wars.' },
            { topic: '6.5', type: 'multiple_choice', stem: 'The Ghost Dance movement among Plains Indians was:', choices: ['A celebration of military victories over the U.S. Army', 'A spiritual revival that the U.S. government feared and tried to suppress', 'A diplomatic effort to negotiate new treaties', 'A political movement for Native voting rights'], correct: 1, explanation: 'The Ghost Dance promised restoration of Native lands and the return of the buffalo; the U.S. government\'s fear of it led directly to Wounded Knee.' },

            { topic: '6.6', type: 'multiple_choice', stem: 'The explosion of the USS Maine (1898) was used to:', choices: ['Justify the annexation of Hawaii', 'Build war fever against Spain, though the cause was likely internal (not Spanish sabotage)', 'Trigger war with Japan', 'Justify the Panama Canal project'], correct: 1, explanation: '"Remember the Maine!" became the war cry; recent research suggests the explosion was an accident, but Hearst\'s papers blamed Spain.' },
            { topic: '6.6', type: 'multiple_choice', stem: 'Anti-imperialists like Mark Twain and Andrew Carnegie argued that:', choices: ['The U.S. needed colonies for military bases', 'Acquiring colonies contradicted American democratic ideals of self-governance', 'American goods needed foreign markets', 'The U.S. had a duty to "civilize" other peoples'], correct: 1, explanation: 'The Anti-Imperialist League argued that governing foreign peoples without their consent violated the founding principle of government by consent of the governed.' },
            { topic: '6.6', type: 'multiple_choice', stem: 'Commodore Dewey\'s victory at Manila Bay (1898) gave the U.S.:', choices: ['Cuba as a protectorate', 'Control of the Philippines, setting off a debate about American imperialism', 'A naval base in Hawaii', 'Victory over Spain in the Caribbean'], correct: 1, explanation: 'Dewey\'s one-sided naval victory raised the question: should the U.S. keep the Philippines? The debate split American politics.' },

            // Unit 7 extras
            { topic: '7.1', type: 'multiple_choice', stem: 'The 16th Amendment (1913) established:', choices: ['Women\'s suffrage', 'Direct election of senators', 'The federal income tax', 'Prohibition of alcohol'], correct: 2, explanation: 'The income tax amendment allowed the federal government to tax incomes directly — funding expanded government programs.' },
            { topic: '7.1', type: 'multiple_choice', stem: 'The 17th Amendment (1913) established:', choices: ['The income tax', 'Prohibition of alcohol', 'Women\'s suffrage', 'Direct election of U.S. senators by popular vote'], correct: 3, explanation: 'Previously senators were chosen by state legislatures (often through corruption); direct election made them more accountable to voters.' },
            { topic: '7.1', type: 'multiple_choice', stem: 'Ida Tarbell\'s investigative journalism targeted:', choices: ['Child labor in textile mills', 'Standard Oil\'s monopolistic practices and destruction of competition', 'Corruption in city government', 'The meat-packing industry'], correct: 1, explanation: 'Tarbell\'s meticulous 19-part series exposed how Rockefeller\'s Standard Oil used secret railroad rebates and predatory pricing to crush competitors.' },

            { topic: '7.2', type: 'multiple_choice', stem: 'The main cause of U.S. entry into WWI in 1917 was:', choices: ['The assassination of Franz Ferdinand', 'German unrestricted submarine warfare sinking American ships', 'The Zimmermann Telegram alone', 'American desire to spread democracy'], correct: 1, explanation: 'Germany\'s decision to resume unrestricted submarine warfare — sinking neutral American ships — was the immediate trigger for the U.S. declaration of war.' },
            { topic: '7.2', type: 'multiple_choice', stem: 'The Espionage and Sedition Acts (1917–18) made it illegal to:', choices: ['Spy for enemy nations', 'Criticize the war effort, the draft, or the government — imprisoning dissenters like Eugene Debs', 'Trade with enemy nations', 'Hire enemy aliens in defense industries'], correct: 1, explanation: 'Socialist leader Eugene Debs was sentenced to 10 years in prison for a speech opposing the draft — the Supreme Court upheld the conviction.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Uncle_Sam_%28pointing_finger%29.jpg/400px-Uncle_Sam_%28pointing_finger%29.jpg', caption: '"I Want YOU" by James Montgomery Flagg, 1917 (public domain)' } },
            { topic: '7.2', type: 'multiple_choice', stem: 'The Great Migration (1915–1970) was the movement of:', choices: ['Europeans immigrating to America', 'Black Southerners moving to Northern cities for industrial jobs and to escape Jim Crow', 'Midwestern farmers moving to California', 'White Southerners leaving for Western states'], correct: 1, explanation: 'About 6 million Black Southerners moved to Northern and Western cities, transforming American culture and demographics.' },

            { topic: '7.3', type: 'multiple_choice', stem: 'The "Red Scare" of 1919–20 was triggered by:', choices: ['The Russian Revolution and fear of communist infiltration in America', 'German spies operating in the U.S.', 'Labor strikes that the government blamed on communists', 'Both the Russian Revolution and fear of labor radicalism'], correct: 3, explanation: 'The Bolshevik Revolution plus a wave of strikes and bombings created mass hysteria; Attorney General Palmer ordered mass arrests of suspected radicals.' },
            { topic: '7.3', type: 'multiple_choice', stem: 'The Scopes Trial (1925) reflected the 1920s conflict between:', choices: ['Labor and capital', 'Science (evolution) and fundamentalist religion', 'Urban and rural economic interests', 'Immigrants and native-born Americans'], correct: 1, explanation: 'John Scopes\' trial for teaching evolution became a nationally broadcast battle between modernism (Darrow) and fundamentalism (Bryan).' },
            { topic: '7.3', type: 'multiple_choice', stem: 'The KKK\'s revival in the 1920s differed from the Reconstruction-era KKK by:', choices: ['Being less violent', 'Targeting not only Black people but also Catholics, Jews, immigrants, and moral transgressors', 'Operating only in the South', 'Being a smaller organization'], correct: 1, explanation: 'The 1920s KKK had 3–6 million members nationwide, targeting anyone seen as threatening "traditional American" (Protestant, white) values.' },

            { topic: '7.4', type: 'multiple_choice', stem: 'Hoover\'s response to the Great Depression was criticized for:', choices: ['Spending too much on relief programs', 'Relying on voluntarism and refusing direct government relief to suffering Americans', 'Raising taxes too quickly', 'Nationalizing failing banks too aggressively'], correct: 1, explanation: 'Hoover believed government handouts would destroy character; by the time he acted more forcefully, the Depression was catastrophic.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Dust_bowl_-_dallas_south_dakota_1936.jpg/640px-Dust_bowl_-_dallas_south_dakota_1936.jpg', caption: 'Dust Bowl, Dallas, South Dakota, 1936 (public domain)' } },
            { topic: '7.4', type: 'multiple_choice', stem: 'The "Bonus Army" (1932) was significant because:', choices: ['It was a private army hired by industrialists', 'Veterans marching to demand early payment of promised bonuses were violently dispersed by the U.S. Army', 'Veterans received their bonuses and went home peacefully', 'It demonstrated Hoover\'s compassion for veterans'], correct: 1, explanation: 'MacArthur\'s use of tanks and tear gas against WWI veterans camped in Washington was a public relations disaster for Hoover.' },
            { topic: '7.4', type: 'multiple_choice', stem: 'Critics of the New Deal from the left, like Huey Long, complained it:', choices: ['Gave too much power to workers', 'Did not go far enough — the wealthy still had too much and the poor too little', 'Was unconstitutional', 'Spent too much money on programs'], correct: 1, explanation: 'Long\'s "Share Our Wealth" plan proposed capping fortunes and guaranteeing minimum incomes — more radical than anything Roosevelt proposed.' },

            { topic: '7.5', type: 'multiple_choice', stem: 'The Neutrality Acts of the 1930s reflected American:', choices: ['Support for European democracies', 'Desire to avoid repeating WWI-era entanglement in European conflicts', 'Preparation for eventual war entry', 'Support for collective security through the League of Nations'], correct: 1, explanation: 'Disillusioned by WWI, Americans passed laws banning arms sales and loans to belligerents — making it hard to help allies.' },
            { topic: '7.5', type: 'multiple_choice', stem: 'Fascism rose in Europe in the 1930s partly because of:', choices: ['Excessive democracy and prosperity', 'Economic hardship from the Depression and resentment of WWI peace terms', 'Strong communist governments preventing reform', 'American isolationism causing European instability'], correct: 1, explanation: 'Humiliation, economic devastation, and weak democracies made Germany, Italy, and Spain vulnerable to charismatic authoritarian movements.' },
            { topic: '7.5', type: 'multiple_choice', stem: 'The cash-and-carry policy (1939) helped Britain by:', choices: ['Giving Britain free American weapons', 'Allowing belligerent nations to buy American arms if they paid cash and carried them away', 'Committing the U.S. to defend Britain', 'Lending ships to Britain'], correct: 1, explanation: 'Cash-and-carry replaced the Neutrality Acts\' arms ban while technically maintaining neutrality — practically it helped Britain which controlled the seas.' },

            { topic: '7.6', type: 'multiple_choice', stem: 'The Manhattan Project was:', choices: ['A New York City urban renewal program', 'The secret U.S. program to develop the atomic bomb', 'A code name for the D-Day invasion', 'A plan to rebuild Manhattan after German bombing'], correct: 1, explanation: 'The Manhattan Project employed over 130,000 people at secret sites across America; its product ended WWII and began the nuclear age.' },
            { topic: '7.6', type: 'multiple_choice', stem: '"Rosie the Riveter" symbolized:', choices: ['Women\'s suffrage movement of the 1920s', 'Women working in defense industries during WWII, challenging gender roles', 'Women nurses serving overseas', 'The Women\'s Army Corps'], correct: 1, explanation: 'With men at war, six million women entered the defense workforce — proving women could do industrial work and changing expectations permanently.' },
            { topic: '7.6', type: 'multiple_choice', stem: '"Island hopping" in the Pacific War meant:', choices: ['Transporting troops between islands in small boats', 'Capturing strategically important islands while bypassing and isolating heavily fortified ones', 'Attacking all Japanese-held islands simultaneously', 'Using aircraft carriers as floating bases'], correct: 1, explanation: 'MacArthur and Nimitz\'s strategy captured key islands for airfields and supply bases while Japanese garrisons on bypassed islands withered.', image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Raising_the_Flag_on_Iwo_Jima%2C_larger_-_edit1.jpg/480px-Raising_the_Flag_on_Iwo_Jima%2C_larger_-_edit1.jpg', caption: 'Flag raising at Iwo Jima, February 23, 1945 (Joe Rosenthal / public domain)' } },

            // Unit 8 extras
            { topic: '8.1', type: 'multiple_choice', stem: 'The Truman Doctrine (1947) committed the United States to:', choices: ['Defending only Western Europe', 'Supporting free peoples resisting subjugation by armed minorities or outside pressures anywhere', 'Providing economic aid to all nations', 'Forming military alliances with democratic nations only'], correct: 1, explanation: 'Announced to justify aid to Greece and Turkey, the Truman Doctrine set a broad precedent for American intervention wherever communism threatened.' },
            { topic: '8.1', type: 'multiple_choice', stem: 'The Berlin Airlift (1948–49) was the U.S. response to:', choices: ['Germany\'s request for economic aid', 'The Soviet blockade of land routes into West Berlin', 'East German refugees flooding into West Berlin', 'Soviet nuclear tests near Berlin'], correct: 1, explanation: 'When the Soviets blockaded land routes, the U.S. and Britain supplied West Berlin entirely by air for 11 months — a Cold War victory without firing a shot.' },
            { topic: '8.1', type: 'multiple_choice', stem: 'China\'s communist revolution (1949) affected U.S. foreign policy by:', choices: ['Causing the U.S. to recognize communist China immediately', 'Intensifying fears of communist expansion and asking "who lost China?"', 'Reducing U.S. military spending in Asia', 'Leading directly to the Korean War with no other factors'], correct: 1, explanation: 'Mao\'s victory shocked Americans who believed China was an ally; Republicans used it to attack Truman as "soft on communism."' },

            { topic: '8.2', type: 'multiple_choice', stem: 'HUAC (House Un-American Activities Committee) investigated:', choices: ['German spies during WWII only', 'Suspected communist infiltration in government, Hollywood, and American institutions', 'Soviet nuclear espionage specifically', 'Labor union finances'], correct: 1, explanation: 'HUAC\'s Hollywood investigations produced the "Hollywood Ten" — writers and directors who went to prison for refusing to cooperate.' },
            { topic: '8.2', type: 'multiple_choice', stem: 'The Soviet launch of Sputnik (1957) caused the U.S. to:', choices: ['Immediately militarize space', 'Fear Soviet technological superiority, leading to education reform and NASA creation', 'Begin arms reduction talks', 'Withdraw from NATO'], correct: 1, explanation: 'Sputnik shocked Americans; Congress passed the National Defense Education Act and NASA was created — the "Space Race" began.' },
            { topic: '8.2', type: 'multiple_choice', stem: 'The GI Bill (Servicemen\'s Readjustment Act, 1944) transformed postwar America by:', choices: ['Drafting veterans into peacetime service', 'Funding education, housing loans, and business loans for veterans — building the middle class', 'Creating the interstate highway system', 'Establishing the Veterans Administration hospitals'], correct: 1, explanation: 'The GI Bill sent millions to college, financed suburban homes, and built a prosperous middle class — the greatest social investment in American history.' },

            { topic: '8.3', type: 'multiple_choice', stem: 'The sit-in movement began at:', choices: ['The Lincoln Memorial in Washington', 'A Woolworth\'s lunch counter in Greensboro, NC (1960)', 'Rosa Parks\'s seat on a Montgomery bus', 'The Edmund Pettus Bridge in Selma'], correct: 1, explanation: 'Four Black college students sat down at a whites-only Woolworth\'s counter and refused to leave; the tactic spread to 54 cities within weeks.' },
            { topic: '8.3', type: 'multiple_choice', stem: 'Freedom Riders in 1961 tested whether:', choices: ['Schools were being desegregated', 'Supreme Court rulings banning segregation in interstate travel were being enforced', 'Southern states would comply with voting rights laws', 'Hotels and restaurants would serve Black customers'], correct: 1, explanation: 'Interracial groups rode buses into the Deep South; violent attacks by mobs (with police complicity) forced federal intervention.' },
            { topic: '8.3', type: 'multiple_choice', stem: 'Malcolm X differed from Martin Luther King Jr. primarily by:', choices: ['Supporting the Democratic Party instead of Republicans', 'Rejecting integration, advocating Black self-defense, and promoting Black nationalism', 'Focusing on economic issues rather than voting rights', 'Working through the courts rather than protest'], correct: 1, explanation: 'Malcolm X\'s message — Black pride, self-determination, and the right to defend against violence — appealed to urban Black communities disillusioned with slow progress.' },

            { topic: '8.4', type: 'multiple_choice', stem: 'Nixon\'s strategy of "Vietnamization" meant:', choices: ['Increasing American troop levels', 'Gradually withdrawing U.S. troops and transferring fighting to South Vietnamese forces', 'Using nuclear threats against North Vietnam', 'Expanding the war into China'], correct: 1, explanation: 'Vietnamization was Nixon\'s plan to end American involvement while maintaining South Vietnam — a strategy that ultimately failed.' },
            { topic: '8.4', type: 'multiple_choice', stem: 'The Pentagon Papers (1971) revealed:', choices: ['Evidence of Soviet espionage in the Defense Department', 'The government had systematically deceived the public and Congress about the Vietnam War\'s progress', 'That the Gulf of Tonkin attack never happened', 'Nixon\'s plans to invade North Vietnam'], correct: 1, explanation: 'Daniel Ellsberg leaked the classified history of U.S. Vietnam decision-making; it confirmed that presidents had lied to the public for years.' },
            { topic: '8.4', type: 'multiple_choice', stem: 'The War Powers Act (1973) was passed to:', choices: ['Increase presidential war powers', 'Require the president to notify Congress within 48 hours of deploying troops and limit deployments to 60 days without approval', 'Formally end the Vietnam War', 'Give Congress the power to command the military'], correct: 1, explanation: 'Congress passed the War Powers Act over Nixon\'s veto to prevent future undeclared wars like Vietnam — though presidents have routinely disputed its constitutionality.' },

            { topic: '8.5', type: 'multiple_choice', stem: 'The Environmental movement was spurred largely by:', choices: ['A major oil spill in Alaska', 'Rachel Carson\'s Silent Spring (1962) exposing the dangers of pesticides like DDT', 'The Three Mile Island nuclear accident', 'Air pollution in Los Angeles in the 1970s'], correct: 1, explanation: 'Carson\'s book showing how DDT moved through the food chain launched modern environmentalism; the EPA was created in 1970.' },
            { topic: '8.5', type: 'multiple_choice', stem: 'Title IX (1972) prohibited:', choices: ['Sex discrimination in employment', 'Sex discrimination in any educational program receiving federal funds', 'Gender wage gaps in government', 'Sexual harassment in the workplace'], correct: 1, explanation: 'Title IX dramatically expanded women\'s athletics and academic opportunities by requiring equal treatment in federally funded schools.' },
            { topic: '8.5', type: 'multiple_choice', stem: 'The American Indian Movement (AIM) occupied Wounded Knee in 1973 to:', choices: ['Honor Native Americans who died there in 1890', 'Protest treaty violations, poverty on reservations, and government neglect of Native peoples', 'Demand that South Dakota return the Black Hills', 'Resist federal termination of tribal status'], correct: 1, explanation: 'The 71-day occupation drew national attention to Native American grievances and federal treaty violations.' },

            { topic: '8.6', type: 'multiple_choice', stem: 'Nixon\'s "Southern Strategy" involved:', choices: ['Economic investment in the South', 'Appealing to white Southern voters resentful of civil rights gains to build a Republican majority', 'Moving federal agencies to Southern states', 'Supporting segregation openly in campaign speeches'], correct: 1, explanation: 'Nixon\'s coded racial appeals — "law and order," "silent majority" — attracted former Democratic white Southerners without explicitly endorsing segregation.' },
            { topic: '8.6', type: 'multiple_choice', stem: 'The SALT I treaty (1972) was significant as:', choices: ['The final end of the nuclear arms race', 'The first arms limitation agreement between the U.S. and Soviet Union', 'A complete nuclear disarmament treaty', 'An agreement banning nuclear testing'], correct: 1, explanation: 'SALT I froze the number of ICBMs and submarine-launched missiles — the first time the superpowers agreed to limit their nuclear arsenals.' },
            { topic: '8.6', type: 'multiple_choice', stem: 'Gerald Ford\'s pardon of Nixon was controversial because:', choices: ['It was ruled unconstitutional', 'Many Americans believed Nixon should face criminal charges and the pardon seemed like a political deal', 'It prevented Congress from completing its investigation', 'Ford did not have the constitutional authority to pardon'], correct: 1, explanation: 'Ford\'s pardon likely cost him the 1976 election; he argued it was necessary to allow the nation to move on, but the public saw it as a cover-up.' },

            // Unit 9 extras
            { topic: '9.1', type: 'multiple_choice', stem: 'The Iran-Contra affair revealed that the Reagan administration had:', choices: ['Negotiated with terrorists to free hostages openly', 'Secretly sold weapons to Iran and used the profits to fund Nicaraguan rebels, violating Congressional restrictions', 'Invaded Iran without Congressional approval', 'Assassinated an Iranian leader'], correct: 1, explanation: 'The scandal showed that Reagan officials had defied a congressional ban on Contra funding — raising questions about who was really in charge.' },
            { topic: '9.1', type: 'multiple_choice', stem: 'Reagan\'s approach to unions was shown by his response to the PATCO strike (1981), in which he:', choices: ['Negotiated a compromise settlement', 'Fired 11,000 striking air traffic controllers and banned them from federal employment', 'Supported the workers\' demands for higher wages', 'Referred the dispute to binding arbitration'], correct: 1, explanation: 'By firing the strikers (who were illegally striking as federal employees), Reagan sent a message to all unions about the limits of labor power.' },
            { topic: '9.1', type: 'multiple_choice', stem: 'The "Reagan Revolution" represented a shift toward:', choices: ['Expanding the welfare state and government regulation', 'Cutting taxes, deregulating industry, reducing social spending, and increasing defense spending', 'Environmental protection and consumer safety', 'Balancing the federal budget as the top priority'], correct: 1, explanation: 'Reagan\'s agenda reversed decades of New Deal/Great Society expansion, arguing government was the problem, not the solution.' },

            { topic: '9.2', type: 'multiple_choice', stem: 'The collapse of the Soviet Union (1991) resulted in:', choices: ['A single democratic Russian state', '15 independent nations from former Soviet republics, including Russia, Ukraine, and the Baltic states', 'A military takeover by the Russian army', 'Immediate NATO membership for all former Soviet states'], correct: 1, explanation: 'The USSR dissolved into 15 successor states; the largest and most powerful was the Russian Federation under Boris Yeltsin.' },
            { topic: '9.2', type: 'multiple_choice', stem: 'The Oslo Accords (1993) were a significant diplomatic achievement because:', choices: ['They ended the Gulf War permanently', 'Israel and the PLO recognized each other and outlined a path toward Palestinian self-governance', 'They reunited North and South Korea', 'They normalized relations between China and Taiwan'], correct: 1, explanation: 'Secretly negotiated in Norway, the Oslo Accords were the first direct Israel-PLO agreement — raising hopes for a two-state solution.' },
            { topic: '9.2', type: 'multiple_choice', stem: 'The Persian Gulf War (1991) was notable for:', choices: ['Taking years of fighting to expel Iraq from Kuwait', 'A rapid 100-hour ground campaign that liberated Kuwait, with a broad coalition under UN mandate', 'The U.S. acting alone without allies', 'Removing Saddam Hussein from power'], correct: 1, explanation: 'Bush deliberately limited the war\'s objective to liberating Kuwait; the coalition of 34 nations and quick victory were seen as a model for post-Cold War American power.' },

            { topic: '9.3', type: 'multiple_choice', stem: 'The Republican Revolution of 1994 brought a conservative House majority led by:', choices: ['Pat Buchanan and the Reform Party', 'Newt Gingrich\'s "Contract with America" — promising welfare reform, term limits, and balanced budgets', 'Bob Dole\'s Senate Republicans', 'Tea Party candidates opposed to Clinton'], correct: 1, explanation: 'Gingrich\'s Contract with America gave House Republicans a unified platform; the 1994 midterms gave them their first House majority in 40 years.' },
            { topic: '9.3', type: 'multiple_choice', stem: 'Welfare reform (1996) changed the system by:', choices: ['Increasing benefits to address growing poverty', 'Replacing AFDC with time-limited TANF requiring work — "ending welfare as we know it"', 'Federalizing all welfare programs', 'Expanding eligibility to more Americans'], correct: 1, explanation: 'The bipartisan welfare reform bill imposed work requirements and time limits on benefits — a major shift in social policy philosophy.' },
            { topic: '9.3', type: 'multiple_choice', stem: 'Clinton\'s presidency achieved a federal budget surplus because of:', choices: ['Major spending cuts to Social Security', 'A combination of 1993 tax increases, spending restraint, and the booming dot-com economy', 'Elimination of the national debt', 'Dramatic cuts to defense spending after the Cold War'], correct: 1, explanation: 'The surplus of the late 1990s resulted from Clinton\'s 1993 tax increases (which Republicans predicted would cause depression), spending controls, and economic growth.' },

            { topic: '9.4', type: 'multiple_choice', stem: 'Income inequality grew significantly from the 1980s primarily because:', choices: ['Immigration reduced wages for native workers', 'Tax cuts, deregulation, globalization, and technology disproportionately benefited the wealthy', 'Labor unions demanded too much, causing unemployment', 'Government spending on social programs declined dramatically'], correct: 1, explanation: 'The combination of Reagan-era tax cuts, financial deregulation, manufacturing offshoring, and the technology premium drove the widest inequality since the Gilded Age.' },
            { topic: '9.4', type: 'multiple_choice', stem: 'The TARP bank bailout (2008) was controversial because:', choices: ['It was ruled unconstitutional by the Supreme Court', 'It used taxpayer money to rescue financial institutions whose risky behavior had caused the crisis', 'It failed to prevent any bank failures', 'It was passed without Congressional approval'], correct: 1, explanation: 'Americans were outraged that Wall Street banks were rescued while millions of homeowners faced foreclosure — the "too big to fail" problem.' },
            { topic: '9.4', type: 'multiple_choice', stem: 'Deindustrialization of the "Rust Belt" was caused primarily by:', choices: ['Excessive union wages making factories uncompetitive', 'Manufacturing jobs moving overseas due to globalization and to lower-wage countries', 'Environmental regulations forcing factory closures', 'Workers choosing to leave manufacturing for better jobs'], correct: 1, explanation: 'Companies moved factories to Mexico, China, and elsewhere for cheaper labor; automation also eliminated millions of manufacturing jobs.' },

            { topic: '9.5', type: 'multiple_choice', stem: 'The Department of Homeland Security was created after 9/11 to:', choices: ['Replace the CIA and FBI', 'Consolidate domestic security agencies — FEMA, Secret Service, Coast Guard, Border Patrol — under one department', 'Conduct foreign intelligence operations', 'Oversee the military\'s domestic operations'], correct: 1, explanation: 'The 9/11 Commission found that poor coordination between agencies missed warning signs; DHS consolidated 22 agencies into one.' },
            { topic: '9.5', type: 'multiple_choice', stem: 'The Abu Ghraib prison scandal (2004) was significant because:', choices: ['It revealed Iraqi prisoners were given too much freedom', 'Photos of American soldiers abusing Iraqi prisoners shocked the world and undermined U.S. credibility', 'It exposed Iranian interference in Iraq', 'Prisoners at Abu Ghraib were tortured by private contractors, not soldiers'], correct: 1, explanation: 'The images of prisoner abuse severely damaged American standing in the Muslim world and contradicted U.S. claims to be liberating Iraq.' },
            { topic: '9.5', type: 'multiple_choice', stem: 'The U.S. killed Osama bin Laden in:', choices: ['Afghanistan in 2009', 'Pakistan in a Navy SEAL raid in 2011', 'Iraq during the 2003 invasion', 'Yemen in a drone strike in 2010'], correct: 1, explanation: 'Navy SEAL Team 6 killed bin Laden in Abbottabad, Pakistan on May 2, 2011 — nearly ten years after 9/11.' },

            { topic: '9.6', type: 'multiple_choice', stem: 'The Tea Party movement (2009–10) arose in opposition to:', choices: ['The Iraq War and Bush\'s foreign policy', 'Government spending, the bank bailouts, and the Affordable Care Act', 'Immigration and multiculturalism', 'Free trade agreements'], correct: 1, explanation: 'The Tea Party channeled grassroots conservative anger at bailouts, stimulus spending, and the ACA into a political movement that shaped the 2010 midterms.' },
            { topic: '9.6', type: 'multiple_choice', stem: 'Obergefell v. Hodges (2015) was a landmark Supreme Court ruling that:', choices: ['Upheld bans on same-sex marriage', 'Legalized same-sex marriage nationwide as a constitutional right', 'Required states to recognize but not perform same-sex marriages', 'Only protected same-sex couples\' rights in states without bans'], correct: 1, explanation: 'The 5–4 ruling held that the 14th Amendment\'s due process and equal protection clauses guarantee the right to marry regardless of sex.' },
            { topic: '9.6', type: 'multiple_choice', stem: 'The COVID-19 pandemic (2020) had major political consequences including:', choices: ['Immediate bipartisan unity in response', 'Intense debate over government mandates, remote learning, economic relief, and vaccine policy that deepened polarization', 'A suspension of the 2020 presidential election', 'Rapid passage of universal healthcare legislation'], correct: 1, explanation: 'The pandemic exposed and deepened political divisions — mask mandates, school closures, and vaccines all became partisan flashpoints.' }
        ];

        function getPuzzlesForTopic(topicId) { return puzzles.filter(p => p.topic === topicId); }
        function getTopicsWithPuzzles() { return [...new Set(puzzles.map(p => p.topic))]; }
        function getAllPuzzles() { return puzzles; }

        return { getPuzzlesForTopic, getTopicsWithPuzzles, getAllPuzzles };
    })();

    // ============================================
    // UI MODULE
    // ============================================
    const UI = (function() {
        let currentPuzzle = null;
        let puzzleQueue = [];

        const introStory = [
            "Your AP US History exam is in two weeks. You are not okay.",
            "Dr. Bailey looks up from his desk and offers a slow nod. \"Go for a climb,\" he says. That's it. Just that.",
            "You figure it means nothing. But that afternoon, walking through the Burk, you pass the rock wall.",
            "Something pulls you toward it. You start climbing.",
            "Hand over hand, higher than you've ever gone — and then, at the very top, the wall gives way.",
            "You fall through a swirling vortex of light, dates, and faces from another century.",
            "Nine eras of American history stretch out before you, each one a world waiting to be explored.",
            "The only way back... is through. Master the eras. Collect the medallions. Make history."
        ];

        function init() {
            setupEventListeners();
            updateContinueButton();
        }

        function setupEventListeners() {
            document.getElementById('new-game-btn').addEventListener('click', startNewGame);
            document.getElementById('continue-btn').addEventListener('click', continueGame);
            document.getElementById('skip-intro-btn').addEventListener('click', skipIntro);

            document.querySelectorAll('.map-region').forEach(region => {
                region.addEventListener('click', function() {
                    const regionId = this.dataset.region;
                    if (!this.classList.contains('locked')) enterRegion(regionId);
                });
            });

            document.getElementById('open-portal-btn').addEventListener('click', openPortal);
            document.getElementById('back-to-map-btn').addEventListener('click', function() { showScreen('map-screen'); updateMapState(); });
            document.getElementById('back-to-region-btn').addEventListener('click', backToRegion);
            document.getElementById('start-practice-btn').addEventListener('click', startPractice);
            document.getElementById('back-to-lesson-btn').addEventListener('click', backToLesson);
            document.getElementById('submit-numerical-btn').addEventListener('click', submitNumericalAnswer);
            document.getElementById('next-puzzle-btn').addEventListener('click', nextPuzzle);

            document.getElementById('numerical-answer').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') submitNumericalAnswer();
            });

            document.getElementById('claim-rune-btn').addEventListener('click', claimRune);
            document.getElementById('credits-btn').addEventListener('click', function() { showScreen('title-screen'); });

            document.getElementById('view-leaderboard-btn').addEventListener('click', showLeaderboard);
            document.getElementById('back-from-leaderboard').addEventListener('click', function() { showScreen('map-screen'); updateMapState(); });
            document.getElementById('submit-score-btn').addEventListener('click', openNameModal);
            document.getElementById('leaderboard-submit-btn').addEventListener('click', openNameModal);
            document.getElementById('submit-name-btn').addEventListener('click', submitScoreToLeaderboard);
            document.getElementById('cancel-name-btn').addEventListener('click', closeNameModal);

            document.getElementById('player-name-input').addEventListener('input', validateNameInput);
            document.getElementById('player-name-input').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') submitScoreToLeaderboard();
            });

        }

        function updateContinueButton() {
            document.getElementById('continue-btn').disabled = !Game.hasSavedGame();
        }

        function showScreen(screenId, transition) {
            const currentScreen = document.querySelector('.screen.active');
            const nextScreen = document.getElementById(screenId);
            transition = transition || 'fade';
            if (currentScreen === nextScreen) return;
            Particles.clear();
            if (transition === 'slide-left') nextScreen.classList.add('slide-in-right');
            else if (transition === 'slide-right') nextScreen.classList.add('slide-in-left');
            else if (transition === 'zoom-in') nextScreen.classList.add('zoom-in');
            else if (transition === 'fade-white') {
                document.getElementById('game-container').classList.add('flash-white');
                setTimeout(() => document.getElementById('game-container').classList.remove('flash-white'), 500);
            }
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            nextScreen.classList.add('active');
            if (screenId === 'rune-screen') {
                setTimeout(function() {
                    const runeEl = document.getElementById('rune-symbol');
                    const rect = runeEl.getBoundingClientRect();
                    Particles.spiral(rect.left + rect.width / 2, rect.top + rect.height / 2, 'rune', 2500);
                }, 300);
            }
            setTimeout(() => nextScreen.classList.remove('slide-in-right', 'slide-in-left', 'zoom-in'), 500);
        }

        function startNewGame() { Game.newGame(); showIntro(); }
        function continueGame() {
            Game.initGame();
            if (Game.hasSeenIntro()) showMap();
            else showIntro();
        }

        function showIntro() {
            showScreen('intro-screen');
            const container = document.getElementById('intro-text');
            container.innerHTML = '';
            introStory.forEach((line, i) => {
                setTimeout(() => {
                    const p = document.createElement('p');
                    p.textContent = line;
                    p.style.animation = 'fadeInText 1s ease forwards';
                    container.appendChild(p);
                    if (i === introStory.length - 1) {
                        setTimeout(() => { Game.markIntroSeen(); showMap(); }, 3000);
                    }
                }, i * 2000);
            });
        }

        function skipIntro() { Game.markIntroSeen(); showMap(); }
        function showMap() { updateMapState(); showScreen('map-screen'); }

        function updateMapState() {
            document.getElementById('runes-collected').textContent = Game.countRunes();
            const stats = Game.getStats();
            document.getElementById('total-points').textContent = formatPoints(stats.totalPoints);

            document.querySelectorAll('.map-region').forEach(el => {
                const regionId = el.dataset.region;
                if (Game.isRegionAvailable(regionId)) {
                    el.classList.remove('locked');
                    el.classList.toggle('completed', Game.hasRune(regionId));
                } else {
                    el.classList.add('locked');
                }
            });

            document.getElementById('open-portal-btn').classList.toggle('hidden', !Game.hasAllRunes());
        }

        function formatPoints(points) { return points.toLocaleString(); }

        function enterRegion(regionId) {
            const region = Locations.getRegion(regionId);
            if (!region) return;
            Game.setCurrentRegion(regionId);
            document.getElementById('region-screen').dataset.region = regionId;
            document.getElementById('region-title').textContent = region.name;
            document.getElementById('region-description').innerHTML = region.description;
            const topicIds = region.topics.map(t => t.id);
            const mastered = Game.countMasteredTopics(topicIds);
            document.getElementById('topics-mastered').textContent = mastered;
            document.getElementById('topics-total').textContent = region.topics.length;
            const grid = document.getElementById('topics-grid');
            grid.innerHTML = '';
            region.topics.forEach(topic => {
                const card = document.createElement('div');
                card.className = 'topic-card';
                const isMastered = Game.isTopicMastered(topic.id);
                if (isMastered) card.classList.add('mastered');
                const progress = Game.getTopicProgress(topic.id);
                const statusText = isMastered ? 'Mastered' : progress.streak + '/' + Game.MASTERY_THRESHOLD;
                card.innerHTML = '<div class="topic-info"><div class="topic-number">Topic ' + topic.id + '</div><div class="topic-name">' + topic.name + '</div></div><div class="topic-status">' + statusText + '</div>';
                card.addEventListener('click', function() { openTopic(topic.id); });
                grid.appendChild(card);
            });
            showScreen('region-screen', 'zoom-in');
        }

        function backToRegion() {
            const regionId = Game.getCurrentRegion();
            if (regionId) enterRegion(regionId);
            else showMap();
        }

        function openTopic(topicId) {
            const lesson = Lessons.getLesson(topicId);
            Game.setCurrentTopic(topicId);
            document.getElementById('lesson-title').textContent = topicId + ': ' + lesson.title;
            document.getElementById('lesson-content').innerHTML = lesson.content;
            showScreen('lesson-screen', 'slide-left');
        }

        function backToLesson() {
            const topicId = Game.getCurrentTopic();
            if (topicId) openTopic(topicId);
            else backToRegion();
        }

        function startPractice() {
            const topicId = Game.getCurrentTopic();
            if (!topicId) return;
            const puzzles = Puzzles.getPuzzlesForTopic(topicId);
            if (!puzzles || puzzles.length === 0) { alert('No puzzles available for this topic yet.'); return; }
            puzzleQueue = shuffleArray(puzzles.slice());
            const lesson = Lessons.getLesson(topicId);
            document.getElementById('puzzle-topic-title').textContent = lesson ? lesson.title : 'Topic ' + topicId;
            updateStreakDisplay();
            showNextPuzzle();
            showScreen('puzzle-screen', 'slide-left');
        }

        function showNextPuzzle() {
            const topicId = Game.getCurrentTopic();
            if (Game.isTopicMastered(topicId)) { showMasteryComplete(); return; }
            if (puzzleQueue.length === 0) puzzleQueue = shuffleArray(Puzzles.getPuzzlesForTopic(topicId).slice());
            currentPuzzle = puzzleQueue.shift();
            renderPuzzle(currentPuzzle);
        }

        function renderPuzzle(puzzle) {
            document.getElementById('puzzle-feedback').classList.add('hidden');
            document.getElementById('puzzle-stem').innerHTML = puzzle.stem;
            const imgDiv = document.getElementById('puzzle-image');
            if (puzzle.image) {
                const img = document.getElementById('puzzle-img');
                img.src = puzzle.image.url;
                img.alt = puzzle.image.caption || '';
                document.getElementById('puzzle-img-caption').textContent = puzzle.image.caption || '';
                imgDiv.classList.remove('hidden');
            } else {
                imgDiv.classList.add('hidden');
            }
            const choicesContainer = document.getElementById('puzzle-choices');
            const inputArea = document.getElementById('puzzle-input-area');
            choicesContainer.classList.remove('matching-puzzle');
            if (puzzle.type === 'multiple_choice') {
                inputArea.classList.add('hidden');
                choicesContainer.classList.remove('hidden');
                choicesContainer.innerHTML = '';
                puzzle.choices.forEach((choice, idx) => {
                    const btn = document.createElement('button');
                    btn.className = 'puzzle-choice';
                    btn.innerHTML = choice;
                    btn.addEventListener('click', function() { selectChoice(idx); });
                    choicesContainer.appendChild(btn);
                });
            } else {
                choicesContainer.classList.add('hidden');
                inputArea.classList.remove('hidden');
                document.getElementById('numerical-answer').value = '';
                document.getElementById('numerical-answer').focus();
            }
        }

        function selectChoice(index) {
            const choices = document.querySelectorAll('.puzzle-choice');
            choices.forEach(c => c.disabled = true);
            choices[index].classList.add('selected');
            const isCorrect = index === currentPuzzle.correct;
            checkAnswer(isCorrect, choices[index], choices[currentPuzzle.correct]);
        }

        function submitNumericalAnswer() {
            const input = document.getElementById('numerical-answer');
            const userAnswer = input.value.trim();
            if (!userAnswer) return;
            const isCorrect = userAnswer.toLowerCase() === String(currentPuzzle.answer).toLowerCase();
            checkAnswer(isCorrect);
        }

        function checkAnswer(isCorrect, selectedEl, correctEl) {
            const topicId = Game.getCurrentTopic();
            const result = Game.recordAnswer(topicId, isCorrect);
            if (selectedEl) selectedEl.classList.add(isCorrect ? 'correct' : 'incorrect');
            if (correctEl && !isCorrect) correctEl.classList.add('correct');
            updateStreakDisplay(isCorrect, result);
            showFeedback(isCorrect, result);
            if (isCorrect) {
                if (result.justMastered) {
                    const rect = document.getElementById('streak-dots').getBoundingClientRect();
                    Particles.celebrationBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
                    triggerMasteryAnimation();
                } else {
                    const dots = document.querySelectorAll('.streak-dot.filled');
                    if (dots.length > 0) {
                        const lastDot = dots[dots.length - 1];
                        const rect = lastDot.getBoundingClientRect();
                        Particles.sparkle(rect.left + rect.width / 2, rect.top + rect.height / 2, 'correct', 12);
                    }
                }
            } else {
                triggerScreenShake();
                if (selectedEl) {
                    const rect = selectedEl.getBoundingClientRect();
                    Particles.fadeParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 'incorrect', 8);
                }
            }
        }

        function triggerScreenShake() {
            const container = document.getElementById('puzzle-container');
            container.classList.add('shake-animation');
            setTimeout(() => container.classList.remove('shake-animation'), 200);
        }

        function triggerMasteryAnimation() {
            document.querySelectorAll('.streak-dot').forEach((dot, i) => {
                setTimeout(() => {
                    dot.classList.add('pulse-animation');
                    setTimeout(() => dot.classList.remove('pulse-animation'), 500);
                }, i * 100);
            });
        }

        function showFeedback(isCorrect, result) {
            const feedbackArea = document.getElementById('puzzle-feedback');
            const feedbackResult = document.getElementById('feedback-result');
            const feedbackExplanation = document.getElementById('feedback-explanation');
            feedbackResult.className = isCorrect ? 'correct' : 'incorrect';
            if (result.justMastered) feedbackResult.textContent = 'Topic Mastered!';
            else if (isCorrect) feedbackResult.textContent = 'Correct!';
            else feedbackResult.textContent = 'Not quite...';
            if (isCorrect && result.pointsEarned > 0) showPointsEarned(result.pointsEarned);
            feedbackExplanation.innerHTML = currentPuzzle.explanation || '';
            feedbackArea.classList.remove('hidden');
            document.getElementById('next-puzzle-btn').textContent = result.justMastered ? 'Continue' : 'Next Problem';
        }

        function showPointsEarned(points) {
            const display = document.getElementById('points-earned-display');
            display.textContent = '+' + points + ' pts';
            display.classList.remove('animate');
            void display.offsetWidth;
            display.classList.add('animate');
            setTimeout(() => { display.textContent = ''; display.classList.remove('animate'); }, 600);
        }

        function nextPuzzle() {
            const topicId = Game.getCurrentTopic();
            if (Game.isTopicMastered(topicId)) {
                const regionId = Game.getCurrentRegion();
                const region = Locations.getRegion(regionId);
                if (region) {
                    const topicIds = region.topics.map(t => t.id);
                    if (Game.areAllTopicsMastered(topicIds) && !Game.hasRune(regionId)) {
                        showRuneScreen(regionId);
                        return;
                    }
                }
                backToRegion();
            } else {
                showNextPuzzle();
            }
        }

        function showMasteryComplete() {
            document.getElementById('feedback-result').className = 'correct';
            document.getElementById('feedback-result').textContent = 'Already Mastered!';
            document.getElementById('feedback-explanation').innerHTML = 'You have already proven mastery of this topic.';
            document.getElementById('puzzle-stem').innerHTML = '';
            document.getElementById('puzzle-choices').innerHTML = '';
            document.getElementById('puzzle-input-area').classList.add('hidden');
            document.getElementById('puzzle-feedback').classList.remove('hidden');
            document.getElementById('next-puzzle-btn').textContent = 'Return';
        }

        function updateStreakDisplay(isCorrect, result) {
            const topicId = Game.getCurrentTopic();
            const streak = Game.getTopicStreak(topicId);
            const container = document.getElementById('streak-dots');
            const existingDots = container.querySelectorAll('.streak-dot.filled');
            const previousStreak = existingDots ? existingDots.length : 0;
            container.innerHTML = '';
            for (let i = 0; i < Game.MASTERY_THRESHOLD; i++) {
                const dot = document.createElement('div');
                dot.className = 'streak-dot' + (i < streak ? ' filled' : '');
                if (isCorrect === true && i === streak - 1 && i >= previousStreak) dot.classList.add('fill-animation');
                container.appendChild(dot);
            }
        }

        function showRuneScreen(regionId) {
            const region = Locations.getRegion(regionId);
            if (!region) return;
            document.getElementById('rune-symbol').textContent = region.runeSymbol || '✦';
            document.getElementById('rune-message').textContent = region.runeMessage || 'You have mastered ' + region.name + '.';
            showScreen('rune-screen', 'fade-white');
        }

        function claimRune() {
            const regionId = Game.getCurrentRegion();
            Game.collectRune(regionId);
            if (Game.hasAllRunes()) { Game.markGameCompleted(); showVictory(); }
            else showMap();
        }

        function showVictory() {
            const stats = Game.getStats();
            document.getElementById('total-problems-solved').textContent = stats.totalProblemsCorrect;
            document.getElementById('total-topics-mastered').textContent = stats.totalTopicsMastered;
            document.getElementById('victory-total-points').textContent = formatPoints(stats.totalPoints);
            showScreen('victory-screen');
        }

        function openPortal() { if (Game.hasAllRunes()) showVictory(); }

        function shuffleArray(arr) {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        // ============================================
        // LEADERBOARD FUNCTIONS
        // ============================================
        function showLeaderboard() { showScreen('leaderboard-screen'); loadLeaderboard(); }

        function loadLeaderboard() {
            const container = document.getElementById('leaderboard-list');
            container.innerHTML = '<div class="leaderboard-loading">Loading scores...</div>';
            const stats = Game.getStats();
            document.getElementById('leaderboard-your-score').textContent = formatPoints(stats.totalPoints);
            if (!Leaderboard.isReady()) {
                container.innerHTML = '<div class="leaderboard-empty">Leaderboard requires Firebase configuration.</div>';
                return;
            }
            Leaderboard.getTopScores(20).then(renderLeaderboard).catch(function() {
                container.innerHTML = '<div class="leaderboard-empty">Failed to load leaderboard. Please try again.</div>';
            });
        }

        function renderLeaderboard(scores) {
            const container = document.getElementById('leaderboard-list');
            const currentPlayerId = Leaderboard.getPlayerId();
            if (!scores || scores.length === 0) {
                container.innerHTML = '<div class="leaderboard-empty">No scores yet. Be the first to submit!</div>';
                return;
            }
            container.innerHTML = '';
            scores.forEach(function(entry, index) {
                const div = document.createElement('div');
                div.className = 'leaderboard-entry';
                if (entry.id === currentPlayerId) div.classList.add('current-player');
                div.innerHTML = '<div class="leaderboard-rank">' + (index + 1) + '</div>' +
                    '<div class="leaderboard-name">' + escapeHtml(entry.name) + '</div>' +
                    '<div class="leaderboard-points">' + formatPoints(entry.points) + '</div>';
                container.appendChild(div);
            });
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function openNameModal() {
            const input = document.getElementById('player-name-input');
            const error = document.getElementById('name-error');
            input.value = '';
            input.classList.remove('invalid');
            error.classList.add('hidden');
            error.textContent = '';
            document.getElementById('name-modal').classList.remove('hidden');
            input.focus();
        }

        function closeNameModal() { document.getElementById('name-modal').classList.add('hidden'); }

        function validateNameInput() {
            const input = document.getElementById('player-name-input');
            const error = document.getElementById('name-error');
            const submitBtn = document.getElementById('submit-name-btn');
            const name = input.value.trim();
            if (name.length === 0) { input.classList.remove('invalid'); error.classList.add('hidden'); submitBtn.disabled = false; return; }
            const errorMsg = NameFilter.getErrorMessage(name);
            if (errorMsg) {
                input.classList.add('invalid');
                error.textContent = errorMsg;
                error.classList.remove('hidden');
                submitBtn.disabled = true;
            } else {
                input.classList.remove('invalid');
                error.classList.add('hidden');
                submitBtn.disabled = false;
            }
        }

        function submitScoreToLeaderboard() {
            const input = document.getElementById('player-name-input');
            const error = document.getElementById('name-error');
            const submitBtn = document.getElementById('submit-name-btn');
            const name = input.value.trim();
            if (!NameFilter.isValid(name)) {
                input.classList.add('invalid');
                error.textContent = NameFilter.getErrorMessage(name) || 'Please enter a valid name';
                error.classList.remove('hidden');
                return;
            }
            if (!Leaderboard.isReady()) {
                error.textContent = 'Leaderboard is not configured.';
                error.classList.remove('hidden');
                return;
            }
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            const stats = Game.getStats();
            Leaderboard.submitScore(name, stats.totalPoints).then(function() {
                closeNameModal();
                showLeaderboard();
            }).catch(function(err) {
                var msg = 'Failed to submit. ';
                if (err.code === 'PERMISSION_DENIED') msg += 'Database permissions need configuration.';
                else if (err.message) msg += err.message;
                else msg += 'Please try again.';
                error.textContent = msg;
                error.classList.remove('hidden');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Score';
            });
        }

        return { init, showScreen, showMap };
    })();

    // ============================================
    // FIREBASE CONFIGURATION
    // ============================================
    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyAsyiWaaZ8gGawO4d5fKXdECyKYdEVOXIo",
        authDomain: "manifest-destined.firebaseapp.com",
        databaseURL: "https://manifest-destined-default-rtdb.firebaseio.com",
        projectId: "manifest-destined",
        storageBucket: "manifest-destined.firebasestorage.app",
        messagingSenderId: "877193828771",
        appId: "1:877193828771:web:cb1e9cc77d92adcb41e216"
    };

    // ============================================
    // INITIALIZATION
    // ============================================
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Manifest Destined for Greatness - MBA AP US History Adventure - Initializing...');
        Particles.init();
        Game.initGame();

        if (FIREBASE_CONFIG.apiKey) {
            if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
                firebase.initializeApp(FIREBASE_CONFIG);
            }
            var leaderboardReady = Leaderboard.init(FIREBASE_CONFIG);
            if (leaderboardReady) console.log('Leaderboard initialized');
            CloudSave.init();
            console.log('Cloud save initialized');
        } else {
            console.log('Firebase not configured - leaderboard and cloud save disabled');
        }

        UI.init();
        UI.showScreen('title-screen');

        var topics = Puzzles.getTopicsWithPuzzles();
        console.log('Puzzles loaded for ' + topics.length + ' topics');
        console.log('Game ready!');
    });

    // Debug tools
    window.ManifestDestinedDebug = {
        Game, Locations, Lessons, Puzzles, Particles, UI, Leaderboard, NameFilter, Auth, CloudSave,
        resetGame: function() { Game.clearSave(); location.reload(); },
        grantAllMedallions: function() {
            Locations.getRegionIds().forEach(id => Game.collectRune(id));
            console.log('All medallions granted!');
        },
        testParticles: function(type) {
            type = type || 'correct';
            const x = window.innerWidth / 2, y = window.innerHeight / 2;
            if (type === 'celebration') Particles.celebrationBurst(x, y);
            else if (type === 'spiral') Particles.spiral(x, y, 'rune');
            else Particles.burst(x, y, type, 30);
        }
    };

})();




