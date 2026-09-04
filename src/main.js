import { memoryData } from './data/memories.js';
import gsap from 'https://esm.sh/gsap';
import ScrollTrigger from 'https://esm.sh/gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let currentChapter = 1;
const totalChapters = 7;
let isAudioPlaying = false;
let bgAudio;
let wasAudioPlayingBeforeVideo = false;

document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  startGlobalParticles();
  initMagneticButtons();
  setupTouchSwipes();
});

function initLoadingScreen() {
  const progressBar = document.getElementById('progress-bar');
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress > 100) progress = 100;
    progressBar.style.width = `${progress}%`;
    
    if (progress === 100) {
      clearInterval(interval);
      setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        startOpeningExperience();
      }, 500);
    }
  }, 300);
}

function startOpeningExperience() {
  const openingSection = document.getElementById('opening-section');
  openingSection.classList.remove('hidden');

  const t1 = document.getElementById('opening-text-1');
  const t2 = document.getElementById('opening-text-2');
  const t3 = document.getElementById('opening-text-3');
  const enterBtn = document.getElementById('enter-btn');

  const tl = gsap.timeline();
  
  tl.from(t1, { opacity: 0, duration: 2, ease: 'power2.inOut' })
    .to(t1, { opacity: 0, duration: 1, delay: 2 })
    .call(() => { t1.classList.add('hidden'); t2.classList.remove('hidden'); })
    .fromTo(t2, { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: 2 })
    .to(t2, { opacity: 0, duration: 1, delay: 2 })
    .call(() => { t2.classList.add('hidden'); t3.classList.remove('hidden'); })
    .fromTo(t3, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 2 })
    .to(t3, { opacity: 0, duration: 1, delay: 2 })
    .call(() => { t3.classList.add('hidden'); enterBtn.classList.remove('hidden'); })
    .fromTo(enterBtn, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1 });

  enterBtn.addEventListener('click', () => {
    gsap.to(openingSection, { opacity: 0, duration: 1, onComplete: () => {
      openingSection.classList.add('hidden');
      initMainExperience();
    }});
  });
}

function initMainExperience() {
  document.getElementById('main-content').classList.remove('hidden');
  // Audio Setup
  bgAudio = document.getElementById('bg-audio');
  bgAudio.src = memoryData.audio.background;
  
  const musicBtn = document.getElementById('toggle-music');
  const visualizer = document.getElementById('music-visualizer');
  
  // Auto-play music since the user interacted with the 'Enter' button
  bgAudio.play().then(() => {
    isAudioPlaying = true;
    musicBtn.innerText = "Music ON";
    visualizer.classList.remove('hidden');
  }).catch(() => {
    // In case browser blocks it
    isAudioPlaying = false;
    musicBtn.innerText = "Music OFF";
    visualizer.classList.add('hidden');
  });
  
  musicBtn.addEventListener('click', () => {
    if (isAudioPlaying) {
      bgAudio.pause();
      musicBtn.innerText = "Music OFF";
      visualizer.classList.add('hidden');
    } else {
      bgAudio.play();
      musicBtn.innerText = "Music ON";
      visualizer.classList.remove('hidden');
    }
    isAudioPlaying = !isAudioPlaying;
  });

  populateData();
  setupAnimations();
  setupInteractions();
}

function populateData() {
  // Hero
  document.querySelector('.hero-bg').style.backgroundImage = `url('${memoryData.photos.hero}')`;
  document.querySelector('.hero-title').innerHTML = memoryData.hero.title;
  document.querySelector('.hero-subtitle').innerText = memoryData.hero.subtitle;

  // Timeline
  const timelineContainer = document.getElementById('timeline-container');
  memoryData.storyTimeline.forEach(item => {
    const div = document.createElement('div');
    div.className = 'timeline-item';
    
    let mediaHTML = '';
    if (item.isEnvelope) {
        const instaSvgInside = item.hasInstaLogo ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c3848b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 8px;"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>` : '';
        
        mediaHTML = `
          <div class="envelope-item timeline-envelope" style="margin-bottom: 20px; width: 250px; height: 180px;">
            <div class="flap"></div>
            <div class="content" style="padding-top: 15px; overflow-y: auto;">
              ${instaSvgInside}
              <p style="font-size: 0.85rem; line-height: 1.4; margin: 0;">${item.envelopeMessage}</p>
            </div>
            <div class="front"><span class="envelope-label">${item.envelopeLabel || 'Open'}</span></div>
          </div>
        `;
    } else {
        mediaHTML = `<img src="${item.photo}" class="timeline-photo" alt="Memory" onerror="this.src='https://images.unsplash.com/photo-1518199268839-497c645b7367?auto=format&fit=crop&w=400&q=80'">`;
    }

    div.innerHTML = `
      ${mediaHTML}
      <h3 class="timeline-title">${item.title}</h3>
      <p class="timeline-date">${item.date}</p>
      <p>${item.description}</p>
    `;
    
    if (item.isEnvelope) {
      const env = div.querySelector('.timeline-envelope');
      env.addEventListener('click', () => {
        env.classList.toggle('open');
      });
    }

    timelineContainer.appendChild(div);
  });

  // Scrapbook Collage
  const scrapbookContainer = document.getElementById('scrapbook-collage-container');
  if (scrapbookContainer) {
    const allScrapbookPhotos = [memoryData.interactivePhoto.center, ...memoryData.interactivePhoto.orbit];
    allScrapbookPhotos.forEach((photo, i) => {
      const div = document.createElement('div');
      div.className = 'collage-item';
      
      // Distribute evenly horizontally with alternate vertical placement to prevent overlapping
      const totalPhotos = allScrapbookPhotos.length;
      const spreadX = -45 + (90 / Math.max(1, totalPhotos - 1)) * i;
      const randomOffsetX = (Math.random() - 0.5) * 10;
      const targetX = spreadX + randomOffsetX;
      
      const baseY = i % 2 === 0 ? -25 : 25; 
      const targetY = baseY + (Math.random() - 0.5) * 25;

      const randomRotate = Math.floor(Math.random() * 40) - 20; // -20deg to 20deg
      
      div.style.left = `calc(50% - 100px + ${targetX}%)`;
      div.style.top = `calc(50% - 125px + ${targetY}%)`;
      div.style.transform = `rotate(${randomRotate}deg)`;
      div.setAttribute('data-rotation', randomRotate); // store for GSAP
      
      const img = document.createElement('img');
      img.src = photo;
      img.className = 'collage-img';
      
      const caption = document.createElement('p');
      caption.className = 'collage-caption';
      caption.textContent = ["Love", "Us", "Forever", "Memories", "🩷"][i % 5];
      
      div.appendChild(img);
      div.appendChild(caption);
      scrapbookContainer.appendChild(div);
    });

    // Add aesthetic stickers
    const stickers = [
      { type: 'emoji', content: '🌻', x: -45, y: -40, r: -15, scale: 1.2, p: 20 },
      { type: 'emoji', content: '💋', x: 45, y: 40, r: 25, scale: 1.5, p: -30 },
      { type: 'text', content: 'My favorite person', x: -30, y: 20, r: -10, scale: 1, p: 10 },
      { type: 'text', content: 'You make me happy', x: 20, y: -35, r: 10, scale: 1, p: -10 },
      { type: 'emoji', content: '💌', x: 5, y: 35, r: 5, scale: 1.3, p: 40 },
      { type: 'text', content: 'My Dearest,', x: 35, y: -10, r: -25, scale: 1, p: -20 },
      { type: 'emoji', content: '🧿', x: -35, y: 10, r: -5, scale: 1, p: 15 },
      { type: 'emoji', content: '✨', x: 0, y: -45, r: 0, scale: 1.5, p: 50 },
      { type: 'emoji', content: '✨', x: -40, y: 30, r: 10, scale: 1, p: 30 },
      { type: 'text', content: 'Together at Last', x: -10, y: -20, r: 5, scale: 0.9, p: -20 },
      { type: 'emoji', content: '🦋', x: 25, y: 25, r: -15, scale: 1.4, p: 60 },
      { type: 'emoji', content: '🩷', x: -20, y: -10, r: 15, scale: 1.2, p: -40 },
      { type: 'emoji', content: '🩷', x: 30, y: 0, r: -10, scale: 0.8, p: 20 },
      { type: 'text', content: 'XOXOXO', x: -25, y: 45, r: 15, scale: 0.8, p: -10 },
      { type: 'text', content: 'Always.', x: 45, y: -25, r: -5, scale: 1.1, p: 30 },
      { type: 'emoji', content: '🌸', x: 15, y: -45, r: 20, scale: 1.3, p: 25 },
      { type: 'emoji', content: '🌸', x: -15, y: 40, r: -20, scale: 1.1, p: -25 },
    ];

    stickers.forEach(s => {
      const stickerEl = document.createElement('div');
      stickerEl.className = 'scrapbook-sticker';
      stickerEl.style.left = `calc(50% + ${s.x}%)`;
      stickerEl.style.top = `calc(50% + ${s.y}%)`;
      stickerEl.style.transform = `rotate(${s.r}deg) scale(${s.scale || 1})`;
      stickerEl.setAttribute('data-rotation', s.r);
      stickerEl.setAttribute('data-scale', s.scale || 1);
      stickerEl.setAttribute('data-parallax', s.p || 0);
      
      if (s.type === 'emoji') {
        stickerEl.classList.add('sticker-emoji');
        stickerEl.textContent = s.content;
      } else {
        stickerEl.classList.add('sticker-text');
        stickerEl.textContent = s.content;
      }
      
      scrapbookContainer.appendChild(stickerEl);
    });
  }

  // Polaroids
  const polaroidContainer = document.getElementById('polaroid-container');
  memoryData.polaroids.forEach(p => {
    const div = document.createElement('div');
    div.className = 'polaroid-card';
    div.style.setProperty('--random', Math.random());
    div.innerHTML = `
      <img src="${p.photo}" onerror="this.src='https://images.unsplash.com/photo-1520299607509-dcd935f9a839?auto=format&fit=crop&w=300&q=80'">
      <div class="polaroid-caption">${p.caption}</div>
      <div class="polaroid-date">${p.date}</div>
    `;
    polaroidContainer.appendChild(div);
  });

  // Moments
  const momentsGrid = document.getElementById('moments-grid');
  memoryData.momentsILove.forEach(m => {
    const div = document.createElement('div');
    div.className = 'moment-card';
    div.innerHTML = `<h3>${m.title}</h3><p class="moment-message">${m.text}</p>`;
    div.addEventListener('click', () => {
      const msg = div.querySelector('.moment-message');
      msg.style.display = msg.style.display === 'block' ? 'none' : 'block';
    });
    momentsGrid.appendChild(div);
  });


  // Videos
  const videoCarousel = document.getElementById('video-carousel');
  memoryData.videoMemories.forEach(v => {
    const div = document.createElement('div');
    div.className = 'video-card glass';
    div.innerHTML = `
      <video src="${v.video}" loop muted playsinline></video>
      <div class="video-overlay-play">▶</div>
      <p class="video-subtitle">${v.title} - ${v.date}</p>
    `;
    div.addEventListener('click', () => openFullscreenVideo(v.video));
    videoCarousel.appendChild(div);
  });

  // If You Were Here
  document.getElementById('iywh-bg').style.backgroundImage = `url('${memoryData.ifYouWereHere.photo}')`;
  const iywhLines = document.getElementById('iywh-lines');
  memoryData.ifYouWereHere.lines.forEach(l => {
    const p = document.createElement('p');
    p.className = 'iywh-line';
    p.innerText = l;
    iywhLines.appendChild(p);
  });

  // Secret Message
  document.getElementById('secret-teaser').innerText = memoryData.secretMessage.teaser;
  document.getElementById('secret-reveal-btn').innerText = memoryData.secretMessage.button;
  document.getElementById('secret-msg-1').innerText = memoryData.secretMessage.messages[0];
  document.getElementById('secret-msg-2').innerText = memoryData.secretMessage.messages[1];



  // Heart
  document.getElementById('heart-instruction').innerText = memoryData.interactiveHeart.button;
  document.getElementById('heart-msg-1').innerText = memoryData.interactiveHeart.messages[0];
  document.getElementById('heart-msg-2').innerText = memoryData.interactiveHeart.messages[1];

  // Ring & Names
  document.getElementById('ring-img').src = memoryData.photos.ring;
  document.getElementById('final-names').innerText = `${memoryData.names.you} 🩷 ${memoryData.names.her}`;
  
  // Final Screen
  document.getElementById('final-forever-q').innerText = memoryData.finalForeverScreen.question;
  document.getElementById('final-yes-btn').innerText = memoryData.finalForeverScreen.button;
  const fyt = document.getElementById('final-yes-text');
  memoryData.finalForeverScreen.messages.forEach(m => {
    const p = document.createElement('p');
    p.innerText = m;
    p.className = "mb-2";
    fyt.appendChild(p);
  });

}

function setupAnimations() {

  // Hero Parallax
  gsap.to('.hero-bg', {
    yPercent: 30,
    ease: "none",
    scrollTrigger: {
      trigger: "#hero-section",
      start: "top top",
      end: "bottom top",
      scrub: true
    }
  });

  // Cinematic Fades for sections
  gsap.utils.toArray('.cinematic-section').forEach(sec => {
    gsap.from(sec, {
      scrollTrigger: { trigger: sec, start: "top 85%" },
      filter: "blur(15px)",
      opacity: 0,
      y: 50,
      rotationX: 5,
      scale: 0.95,
      duration: 1.8,
      ease: 'power3.out'
    });
  });

  // Timeline Items Stagger Fade (Envelopes and Text)
  gsap.from('.timeline-item', {
    scrollTrigger: {
      trigger: "#story-section",
      start: "top 60%"
    },
    y: 50,
    opacity: 0,
    duration: 1,
    stagger: 0.3,
    ease: "power3.out"
  });

  // Cinematic Photo Reveal for the "Today" image
  gsap.from('.timeline-photo', {
    scrollTrigger: {
      trigger: ".timeline-photo",
      start: "top 80%"
    },
    clipPath: "inset(100% 0% 0% 0%)",
    scale: 1.3,
    filter: "blur(10px)",
    duration: 1.8,
    ease: "power4.out",
    delay: 0.2
  });

  // Scrapbook Collage Fall Animation (Cinematic Throw)
  const collageItems = document.querySelectorAll('.collage-item');
  if (collageItems.length > 0) {
    collageItems.forEach((item, index) => {
      const targetRotate = item.getAttribute('data-rotation');
      gsap.from(item, {
        scrollTrigger: {
          trigger: "#interactive-photo-section",
          start: "top 60%"
        },
        y: -500,
        x: (Math.random() - 0.5) * 300,
        rotation: targetRotate - (Math.random() * 180 - 90),
        scale: 2,
        opacity: 0,
        duration: 1.8,
        delay: index * 0.15,
        ease: "power3.out"
      });
    });
  }

  // Sticker Cinematic Drop & Parallax
  const stickerItems = document.querySelectorAll('.scrapbook-sticker');
  if (stickerItems.length > 0) {
    stickerItems.forEach((item, index) => {
      const targetRotate = item.getAttribute('data-rotation');
      const targetScale = item.getAttribute('data-scale');
      const parallaxSpeed = item.getAttribute('data-parallax');
      
      // Entrance Animation
      gsap.from(item, {
        scrollTrigger: {
          trigger: "#interactive-photo-section",
          start: "top 60%"
        },
        y: -400,
        rotation: targetRotate - 100,
        scale: 0,
        opacity: 0,
        duration: 1.5,
        delay: index * 0.05 + 0.5,
        ease: "back.out(1.5)"
      });

      // Continuous Parallax Scrolling
      gsap.to(item, {
        scrollTrigger: {
          trigger: "#interactive-photo-section",
          start: "top bottom",
          end: "bottom top",
          scrub: 1
        },
        yPercent: parallaxSpeed
      });
    });
  }


  // Video cards will just use the base .cinematic-section fade-in

  // If You Were Here text stagger
  ScrollTrigger.create({
    trigger: "#if-you-were-here-section",
    start: "top 50%",
    once: true,
    onEnter: () => {
      gsap.to('.iywh-line', {
        opacity: 1,
        y: 0,
        duration: 1.5,
        stagger: 1.5,
        ease: "power2.out"
      });
    }
  });

  // Special Birthday
  ScrollTrigger.create({
    trigger: "#birthday-section",
    start: "top center",
    onEnter: () => {
      const b1 = document.getElementById('bday-text-1');
      const b2 = document.getElementById('bday-text-2');
      const b3 = document.getElementById('bday-text-3');
      
      const tl = gsap.timeline();
      tl.call(() => b1.classList.remove('hidden'))
        .fromTo(b1, { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0)", duration: 2 })
        .to(b1, { opacity: 0, duration: 1, delay: 1 })
        .call(() => { b1.classList.add('hidden'); b2.classList.remove('hidden'); })
        .fromTo(b2, { opacity: 0 }, { opacity: 1, duration: 2 })
        .to(b2, { opacity: 0, duration: 1, delay: 1 })
        .call(() => { b2.classList.add('hidden'); b3.classList.remove('hidden'); })
        .fromTo(b3, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 2 })
        .call(() => createParticles('✨', 40));
    },
    once: true
  });

  // Ring
  ScrollTrigger.create({
    trigger: "#ring-section",
    start: "top center",
    onEnter: () => {
      const texts = [1,2,3,4].map(i => document.getElementById('ring-text-'+i));
      const tl = gsap.timeline();
      
      texts.forEach((t, i) => {
        tl.call(() => t.classList.remove('hidden'))
          .fromTo(t, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 2 });
        if (i < 3) {
          tl.to(t, { opacity: 0, duration: 1, delay: 2 })
            .call(() => t.classList.add('hidden'));
        }
      });
    },
    once: true
  });


}


function setupInteractions() {
  init3DTilt('.polaroid-card, .envelope-item');
  
  // Hero Enter Button
  const heroEnterBtn = document.getElementById('hero-enter-btn');
  if (heroEnterBtn) {
    heroEnterBtn.addEventListener('click', () => {
      document.getElementById('story-section').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Secret Message
  document.getElementById('secret-reveal-btn').addEventListener('click', () => {
    document.getElementById('secret-initial').classList.add('hidden');
    const reveal = document.getElementById('secret-reveal');
    reveal.classList.remove('hidden');
    
    gsap.from(reveal, { opacity: 0, duration: 1 });
    
    const tl = gsap.timeline();
    const m1 = document.getElementById('secret-msg-1');
    const m2 = document.getElementById('secret-msg-2');
    tl.call(() => m1.classList.remove('hidden'))
      .fromTo(m1, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 2 })
      .to(m1, { opacity: 0, duration: 1, delay: 3 })
      .call(() => { m1.classList.add('hidden'); m2.classList.remove('hidden'); })
      .fromTo(m2, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 2 });
  });

  // Interactive Heart
  const heart = document.getElementById('glowing-heart');
  let heartClicks = 0;
  heart.addEventListener('click', () => {
    heartClicks++;
    createParticles('🩷', 5);
    if(heartClicks === 1) {
      heart.classList.add('beating');
      const m1 = document.getElementById('heart-msg-1');
      m1.classList.remove('hidden');
      gsap.from(m1, { opacity: 0, duration: 2 });
    } else if(heartClicks === 3) {
      const m2 = document.getElementById('heart-msg-2');
      m2.classList.remove('hidden');
      gsap.from(m2, { opacity: 0, duration: 2 });
      createParticles('🩷', 20);
    }
  });



  // Final Interaction
  const finalYesBtn = document.getElementById('final-yes-btn');
  const finalNoBtn = document.getElementById('final-no-btn');

  finalYesBtn.addEventListener('click', (e) => {
    e.target.classList.add('hidden');
    if (finalNoBtn) finalNoBtn.classList.add('hidden');
    const textWrap = document.getElementById('final-yes-text');
    textWrap.classList.remove('hidden');
    gsap.from(textWrap, { opacity: 0, y: 20, duration: 2, ease: 'power2.out' });
    document.getElementById('final-names').classList.remove('hidden');
    gsap.from('#final-names', { opacity: 0, delay: 1.5, duration: 2 });
    createParticles('🩷', 30);
    createParticles('🎇', 20);
    createParticles('✨', 30);
    if(bgAudio && !isAudioPlaying) {
      bgAudio.play();
      isAudioPlaying = true;
    }
  });

  if (finalNoBtn) {
    const moveNoBtn = () => {
      const randomX = (Math.random() - 0.5) * 400; 
      const randomY = (Math.random() - 0.5) * 400;
      finalNoBtn.style.transform = `translate(${randomX}px, ${randomY}px)`;
    };
    finalNoBtn.addEventListener('mouseover', moveNoBtn);
    finalNoBtn.addEventListener('touchstart', moveNoBtn);
    finalNoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      moveNoBtn();
    });
  }

  // Letter Open (Royal Scroll)
  const scrollRibbon = document.getElementById('scroll-ribbon');
  const royalScroll = document.getElementById('royal-scroll');
  const typeText = document.getElementById('typewriter-letter');
  
  if (scrollRibbon) {
    scrollRibbon.addEventListener('click', () => {
      scrollRibbon.classList.add('hidden');
      royalScroll.classList.add('open');
      
      // Wait for the unroll animation to finish (2s) before animating text
      setTimeout(() => {
        const paragraphs = memoryData.loveLetter.split('\n');
        typeText.innerHTML = '';
        
        let validLineCount = 0;
        paragraphs.forEach((pText) => {
          if (pText.trim() === '') {
            typeText.innerHTML += '<br>';
          } else {
            const span = document.createElement('span');
            span.className = 'letter-fade-in';
            span.innerText = pText;
            typeText.appendChild(span);
            typeText.innerHTML += '<br>';
            validLineCount++;
          }
        });

        const elements = typeText.querySelectorAll('.letter-fade-in');
        elements.forEach((el, index) => {
          setTimeout(() => {
            el.classList.add('visible');
          }, index * 1200); // 1.2s delay between each paragraph
        });
      }, 2000);
    });
  }

  // Voice / Spotify Player
  const playVoice = document.getElementById('play-voice-btn');
  const playIcon = document.getElementById('play-icon');
  const progressBar = document.getElementById('waveform-progress');
  const voiceAudio = document.getElementById('voice-audio');
  
  let isVoicePlaying = false;
  
  if(playVoice) {
    playVoice.addEventListener('click', () => {
      if(!isVoicePlaying) {
        voiceAudio.play().catch(()=>{});
        playIcon.classList.remove('fa-play');
        playIcon.classList.add('fa-pause');
        isVoicePlaying = true;
        if(bgAudio && isAudioPlaying) bgAudio.pause();
      } else {
        voiceAudio.pause();
        playIcon.classList.remove('fa-pause');
        playIcon.classList.add('fa-play');
        isVoicePlaying = false;
        if(bgAudio && isAudioPlaying) bgAudio.play().catch(()=>{});
      }
    });

    voiceAudio.addEventListener('timeupdate', () => {
      const progress = (voiceAudio.currentTime / voiceAudio.duration) * 100;
      if(!isNaN(progress)) {
        progressBar.style.width = `${progress}%`;
      }
    });

    voiceAudio.onended = () => {
      playIcon.classList.remove('fa-pause');
      playIcon.classList.add('fa-play');
      progressBar.style.width = '0%';
      isVoicePlaying = false;
      if(bgAudio && isAudioPlaying) bgAudio.play().catch(()=>{});
    }
  }
  
  // Close Fullscreen Video
  document.getElementById('close-video-btn').addEventListener('click', () => {
    const overlay = document.getElementById('fullscreen-video-overlay');
    overlay.classList.add('hidden');
    const container = document.getElementById('fullscreen-video-container');
    const vid = container.querySelector('video');
    if(vid) vid.pause();
    container.innerHTML = '';

    if (wasAudioPlayingBeforeVideo && bgAudio) {
      bgAudio.play().catch(()=>{});
      isAudioPlaying = true;
      const musicBtn = document.getElementById('toggle-music');
      if(musicBtn) musicBtn.innerText = "Music ON";
      const visualizer = document.getElementById('music-visualizer');
      if(visualizer) visualizer.classList.remove('hidden');
      wasAudioPlayingBeforeVideo = false;
    }
  });
}

function openFullscreenVideo(src) {
  if (bgAudio && isAudioPlaying) {
    wasAudioPlayingBeforeVideo = true;
    bgAudio.pause();
    isAudioPlaying = false;
    const musicBtn = document.getElementById('toggle-music');
    if(musicBtn) musicBtn.innerText = "Music OFF";
    const visualizer = document.getElementById('music-visualizer');
    if(visualizer) visualizer.classList.add('hidden');
  } else {
    wasAudioPlayingBeforeVideo = false;
  }

  const overlay = document.getElementById('fullscreen-video-overlay');
  const container = document.getElementById('fullscreen-video-container');
  container.innerHTML = `<video src="${src}" controls autoplay playsinline></video>`;
  overlay.classList.remove('hidden');
  gsap.from(overlay, { opacity: 0, duration: 0.5 });

  const vid = container.querySelector('video');
  if (vid) {
    vid.onended = () => {
      if (wasAudioPlayingBeforeVideo && bgAudio) {
        bgAudio.play().catch(()=>{});
        isAudioPlaying = true;
        const musicBtn = document.getElementById('toggle-music');
        if(musicBtn) musicBtn.innerText = "Music ON";
        const visualizer = document.getElementById('music-visualizer');
        if(visualizer) visualizer.classList.remove('hidden');
      }
      wasAudioPlayingBeforeVideo = false;
    };
  }
}

function animateValue(id, start, end, duration) {
  const obj = document.getElementById(id);
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

function createParticles(character, count) {
  const container = document.getElementById('particles-container');
  for(let i=0; i<count; i++) {
    const el = document.createElement('div');
    el.className = 'particle-floating';
    el.innerText = character;
    el.style.left = Math.random() * 100 + 'vw';
    el.style.top = (window.innerHeight + 50) + 'px';
    el.style.fontSize = (Math.random() * 20 + 10) + 'px';
    
    // Random animation duration between 3s and 7s
    el.style.animationDuration = (Math.random() * 4 + 3) + 's';
    
    container.appendChild(el);
    setTimeout(() => { el.remove() }, 7000);
  }
}

// Mobile Swipes logic using Touch Events
function setupTouchSwipes() {
  let touchstartY = 0;
  let touchendY = 0;

  window.addEventListener('touchstart', e => {
    touchstartY = e.changedTouches[0].screenY;
  }, { passive: true });

  window.addEventListener('touchend', e => {
    touchendY = e.changedTouches[0].screenY;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    // Normal scroll covers the Y swipe, 
    // but if we want to snap to chapters on fast swipe:
    const diff = touchstartY - touchendY;
    if (Math.abs(diff) > 100) {
      // Create a subtle particle effect on swipe
      createParticles('✨', 3);
    }
  }
}

// --- Advanced Romantic Animations --- //

function startGlobalParticles() {
  const container = document.getElementById('global-particles');
  if (!container) return;
  const elements = ['🩷', '🌸', '✨'];
  
  setInterval(() => {
    const el = document.createElement('div');
    el.className = 'particle-global';
    el.innerText = elements[Math.floor(Math.random() * elements.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.fontSize = (Math.random() * 10 + 10) + 'px';
    el.style.animationDuration = (Math.random() * 10 + 10) + 's';
    
    container.appendChild(el);
    setTimeout(() => {
      if(el.parentNode) el.remove();
    }, 20000);
  }, 1500);
}

function initMagneticButtons() {
  const btns = document.querySelectorAll('.btn-primary');
  btns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, { x: x * 0.4, y: y * 0.4, duration: 0.3, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.3, ease: 'power2.out' });
    });
  });
}

function init3DTilt(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -15;
      const rotateY = ((x - centerX) / centerX) * 15;
      
      gsap.to(el, {
        rotationX: rotateX,
        rotationY: rotateY,
        transformPerspective: 500,
        ease: 'power1.out',
        duration: 0.3
      });
    });
    
    el.addEventListener('mouseleave', () => {
      gsap.to(el, {
        rotationX: 0,
        rotationY: 0,
        duration: 0.5,
        ease: 'power2.out'
      });
    });
  });
}
