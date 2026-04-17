    (() => {
      const root = document.documentElement;

      const loader = document.getElementById("loader");
      const topbar = document.getElementById("topbar");

      const overlay = document.getElementById("menuOverlay");
      const openBtn = document.getElementById("openMenu");
      const closeBtn = document.getElementById("closeMenu");
      const overlayBg = document.getElementById("overlayBg");
      const drawer = document.getElementById("drawer");
      const links = Array.from(document.querySelectorAll("a[data-link]"));

      const heroStage = document.getElementById("home");
      const brandEl = document.getElementById("brand");
      const roleEl = document.getElementById("role");
      const cardsTrack = document.getElementById("cardsTrack");
      const cards = Array.from(document.querySelectorAll("[data-card]"));

      const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
      const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isMobileLayout = () => window.matchMedia("(max-width: 900px)").matches;

      function getMsVar(name, fallbackMs){
        const raw = getComputedStyle(root).getPropertyValue(name).trim();
        if(!raw) return fallbackMs;
        if(raw.endsWith("ms")){ const n = parseFloat(raw); return Number.isFinite(n) ? n : fallbackMs; }
        if(raw.endsWith("s")){ const n = parseFloat(raw); return Number.isFinite(n) ? (n*1000) : fallbackMs; }
        const n = parseFloat(raw);
        return Number.isFinite(n) ? n : fallbackMs;
      }
      function getNumVar(name, fallback){
        const v = getComputedStyle(root).getPropertyValue(name).trim();
        const n = parseFloat(v);
        return Number.isFinite(n) ? n : fallback;
      }

      links.forEach((a, i) => a.style.setProperty("--i", String(i)));

      function ensureMobileCardCloseButton(card){
        if(!card) return null;
        const inner = card.querySelector(".card-inner");
        if(!inner) return null;

        let closeBtn = card.querySelector(".mobile-card-close");
        if(closeBtn) return closeBtn;

        closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "mobile-card-close";
        closeBtn.textContent = "Voltar";
        closeBtn.hidden = true;
        closeBtn.setAttribute("aria-label", "Voltar para os cards");
        inner.insertAdjacentElement("afterbegin", closeBtn);
        return closeBtn;
      }

      const mobileCardShell = document.getElementById("mobileCardShell");
      const mobileCardBackdrop = document.getElementById("mobileCardBackdrop");
      if(mobileCardBackdrop && !mobileCardBackdrop.dataset.bound){
        mobileCardBackdrop.addEventListener("click", () => closeMobileCardModal());
        mobileCardBackdrop.dataset.bound = "true";
      }
      let mobileOpenCard = null;
      let mobileCardReturnFocus = null;
      let mobileCardScrollTop = 0;
      let mobileCardCloseRaf = 0;

      function closeMobileCardModal(options = {}){
        const { restoreFocus = true } = options;
        if(!mobileOpenCard) return;

        const card = mobileOpenCard;
        const closeBtn = card.querySelector(".mobile-card-close");

        card.classList.remove("mobile-modal-open");
        card.removeAttribute("aria-modal");
        card.setAttribute("aria-hidden", "true");
        if(closeBtn) closeBtn.hidden = true;

        if(mobileCardShell && mobileCardShell.contains(card)){
          mobileCardShell.removeChild(card);
        }

        const placeholderParent = card.__mobilePlaceholderParent;
        const placeholderNext = card.__mobilePlaceholderNext;
        if(placeholderParent){
          if(placeholderNext && placeholderNext.parentNode === placeholderParent){
            placeholderParent.insertBefore(card, placeholderNext);
          } else {
            placeholderParent.appendChild(card);
          }
        }

        if(card.__mobilePlaceholder && card.__mobilePlaceholder.parentNode){
          card.__mobilePlaceholder.parentNode.removeChild(card.__mobilePlaceholder);
        }
        card.__mobilePlaceholder = null;

        if(mobileCardShell){
          mobileCardShell.classList.remove("is-open");
          mobileCardShell.setAttribute("aria-hidden", "true");
        }
        if(mobileCardBackdrop){
          mobileCardBackdrop.classList.remove("is-open");
          mobileCardBackdrop.setAttribute("aria-hidden", "true");
        }

        document.body.classList.remove("mobile-card-open");
        document.body.style.overflow = "";
        document.body.style.touchAction = "";

        const placeholder = card.__mobilePlaceholder;
        mobileOpenCard = null;

        window.clearTimeout(mobileCardCloseRaf);
        mobileCardCloseRaf = window.setTimeout(() => {
          if(placeholder){
            window.scrollTo({ top: mobileCardScrollTop, behavior: "auto" });
          }
          if(restoreFocus && mobileCardReturnFocus && typeof mobileCardReturnFocus.focus === "function"){
            try { mobileCardReturnFocus.focus({ preventScroll: true }); } catch(_e){ mobileCardReturnFocus.focus(); }
          }
          mobileCardReturnFocus = null;
        }, 20);
      }

      function openMobileCardModal(card, triggerEl){
        if(!isMobileLayout() || !card || !mobileCardShell) return;
        if(mobileOpenCard === card) return;

        if(mobileOpenCard){
          closeMobileCardModal({ restoreFocus: false });
        }

        const closeBtn = ensureMobileCardCloseButton(card);
        const placeholder = card.__mobilePlaceholder || document.createElement("div");
        placeholder.className = "mobile-card-placeholder";
        placeholder.style.height = `${Math.ceil(card.getBoundingClientRect().height)}px`;
        placeholder.hidden = false;
        if(!card.__mobilePlaceholder){
          card.__mobilePlaceholder = placeholder;
        }

        mobileCardScrollTop = window.scrollY;
        mobileCardReturnFocus = triggerEl || card;

        card.__mobilePlaceholderParent = card.parentNode;
        card.__mobilePlaceholderNext = card.nextSibling;
        card.parentNode.insertBefore(placeholder, card);
        card.setAttribute("aria-hidden", "false");
        card.setAttribute("aria-modal", "true");
        card.classList.add("mobile-modal-open");
        if(closeBtn) closeBtn.hidden = false;

        mobileCardShell.appendChild(card);
        mobileCardShell.classList.add("is-open");
        mobileCardShell.setAttribute("aria-hidden", "false");
        if(mobileCardBackdrop){
          mobileCardBackdrop.classList.add("is-open");
          mobileCardBackdrop.setAttribute("aria-hidden", "false");
        }

        document.body.classList.add("mobile-card-open");
        document.body.style.overflow = "hidden";
        document.body.style.touchAction = "none";

        mobileOpenCard = card;

        const sc = card.querySelector(".card-scroll");
        if(sc) sc.scrollTop = 0;

        window.requestAnimationFrame(() => {
          if(closeBtn) closeBtn.focus({ preventScroll: true });
        });
      }

      function setupMobileCardModals(){
        cards.forEach((card) => {
          const scroll = card.querySelector(".card-scroll");
          if(!scroll) return;

          const closeBtn = ensureMobileCardCloseButton(card);
          if(closeBtn && !closeBtn.dataset.bound){
            closeBtn.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              clearKeyboardStepArm();
          closeMobileCardModal();
            });
            closeBtn.dataset.bound = "true";
          }

          if(!card.hasAttribute("tabindex")) card.tabIndex = 0;

          if(card.dataset.modalBound === "true") return;

          card.addEventListener("click", (e) => {
            if(!isMobileLayout()) return;
            if(mobileOpenCard === card) return;
            if(e.target.closest("a, button, input, textarea, select, label, summary")) return;
            openMobileCardModal(card, card);
          });

          card.addEventListener("keydown", (e) => {
            if(!isMobileLayout()) return;
            if(mobileOpenCard === card) return;
            if(e.key === "Enter" || e.key === " "){
              e.preventDefault();
              openMobileCardModal(card, card);
            }
          });

          card.dataset.modalBound = "true";
        });
      }
      function finishLoader(){
        if(!loader) return;
        document.body.classList.add("is-ready");
        loader.classList.add("is-hidden");
        document.body.classList.remove("is-loading");
        const fade = getMsVar("--loaderFade", 820);
        window.setTimeout(() => { loader.style.display = "none"; }, Math.max(560, fade + 80));
      }
      const LOADER_DUR = getMsVar("--loaderDur", 2500);
      const LOADER_MIN = 2500;
      window.addEventListener("load", () => window.setTimeout(finishLoader, Math.max(LOADER_MIN, LOADER_DUR)), { once: true });
      if(document.readyState === "complete") window.setTimeout(finishLoader, Math.max(LOADER_MIN, LOADER_DUR));
      window.addEventListener("pageshow", (e) => { if(e.persisted) finishLoader(); });
      window.addEventListener("error", () => { try { finishLoader(); } catch(_e){} });

      function openMenu(){
        if(!overlay || !openBtn || !drawer) return;
        if(overlay.classList.contains("is-open")) return;
        overlay.classList.add("is-open");
        overlay.setAttribute("aria-hidden","false");
        openBtn.setAttribute("aria-expanded", "true");
        openBtn.classList.add("is-open");
        document.body.style.overflow = "hidden";
        setTimeout(() => {
          const first = drawer ? drawer.querySelector(".drawer-nav a[data-link]") : null;
          (first || drawer).focus();
        }, 0);
      }
      function closeMenu(){
        if(!overlay || !openBtn) return;
        if(!overlay.classList.contains("is-open")) return;
        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden","true");
        openBtn.setAttribute("aria-expanded", "false");
        openBtn.classList.remove("is-open");
        document.body.style.overflow = "";
      }
      if(openBtn){
        openBtn.addEventListener("click", () => overlay.classList.contains("is-open") ? closeMenu() : openMenu());
      }
      if(closeBtn) closeBtn.addEventListener("click", closeMenu);
      if(overlayBg) overlayBg.addEventListener("click", closeMenu);
      window.addEventListener("keydown", (e) => { if(overlay && e.key === "Escape" && overlay.classList.contains("is-open")) closeMenu(); });


      /* ── Nav active highlight ── */
      function updateNavActive(index){
        document.querySelectorAll("a[data-link]").forEach(a => {
          const i = parseInt(a.getAttribute("data-index"), 10);
          a.classList.toggle("nav-active", i === index);
          if(i !== index){
            a.classList.remove("is-focus-ghost");
          }
        });
      }

      


      function clearNavVisualFocus(){
        const active = document.activeElement;
        if(active && active.matches && active.matches('a[data-link], .topbar-nav a, .drawer-nav a')){
          try{ active.blur(); }catch(_){}
        }
      }

      /* =========================
         HERO: 1 scroll = nome some; frase some automaticamente
         ========================= */
      let step = 0, accum = 0, locked = false, animating = false, lastDir = 0, cooldownUntil = 0;
      let flowStarted = false;
      let buttonHeroAdvanceRunning = false;

      let autoRoleTimer = 0;
      let autoRolePending = false;
      let autoCardTimer = 0;
      let autoCardPending = false;
      let autoDesktopCardTimer = 0;
      let autoDesktopCardPending = false;

      let lastMobileScrollY = window.scrollY || window.pageYOffset || 0;
      let mobileHeroLatchedHidden = false;

      function inHeroViewport(){
        const r = heroStage.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        return (r.top <= vh * 0.35 && r.bottom >= vh * 0.65);
      }
      function lockBody(){
        if(locked) return;
        locked = true;
        document.body.classList.add("is-locked");
      }
      function unlockBody(){
        locked = false;
        document.body.classList.remove("is-locked");
      }

      function applyHeroState(){
        const liftName = getNumVar("--liftName", 140);
        const liftRole = getNumVar("--liftRole", 120);
        const blurMax  = getNumVar("--fadeBlur", 1.6);

        let nameY = 0, nameO = 1, nameB = 0;
        let roleY = 0, roleO = 1, roleB = 0;

        if(step >= 1){ nameY = -liftName; nameO = 0; nameB = blurMax; }
        if(step >= 2){ roleY = -liftRole; roleO = 0; roleB = blurMax * 0.9; }

        root.style.setProperty("--nameY", nameY + "px");
        root.style.setProperty("--nameO", String(nameO));
        root.style.setProperty("--nameB", nameB + "px");

        root.style.setProperty("--roleY", roleY + "px");
        root.style.setProperty("--roleO", String(roleO));
        root.style.setProperty("--roleB", roleB + "px");

        topbar.classList.toggle("show-brand", flowStarted || step >= 1);
      }

      function setCooldown(){
        const cd = getMsVar("--stepCooldown", 70);
        cooldownUntil = performance.now() + cd;
      }

      function stepDurationMs(nextStep){
        if(nextStep === 1) return getMsVar("--easeDurName", 900);
        if(nextStep === 2) return getMsVar("--easeDurRole", 1500);
        return 900;
      }

      function mobileSyncLeadMs(){
        return getMsVar("--mobileSyncLead", 120);
      }

      function mobileCardEnterDurationMs(){
        return getMsVar("--mobileCardEnterDur", 620);
      }

      function clearAutoRole(){
        if(autoRoleTimer) window.clearTimeout(autoRoleTimer);
        autoRoleTimer = 0;
        autoRolePending = false;
      }

      function clearAutoCard(){
        if(autoCardTimer) window.clearTimeout(autoCardTimer);
        autoCardTimer = 0;
        autoCardPending = false;
      }

      function clearAutoDesktopCard(){
        if(autoDesktopCardTimer) window.clearTimeout(autoDesktopCardTimer);
        autoDesktopCardTimer = 0;
        autoDesktopCardPending = false;
      }

      function setHeroTransitionMode(enabled){
        const value = enabled ? "" : "none";
        if(brandEl) brandEl.style.transition = value;
        if(roleEl) roleEl.style.transition = value;
      }

      function syncHeroReturnWithCardProgress(progress){
        const t = clamp(progress, 0, 1);
        const liftName = getNumVar("--liftName", 140);
        const liftRole = getNumVar("--liftRole", 120);
        const blurMax  = getNumVar("--fadeBlur", 1.6);

        root.style.setProperty("--nameY", String(-liftName * (1 - t)) + "px");
        root.style.setProperty("--nameO", String(t));
        root.style.setProperty("--nameB", String(blurMax * (1 - t)) + "px");

        root.style.setProperty("--roleY", String(-liftRole * (1 - t)) + "px");
        root.style.setProperty("--roleO", String(t));
        root.style.setProperty("--roleB", String((blurMax * 0.9) * (1 - t)) + "px");
      }

      function syncHeroReverseStepSequence(progress){
        const t = clamp(progress, 0, 1);
        const liftName = getNumVar("--liftName", 140);
        const liftRole = getNumVar("--liftRole", 120);
        const blurMax  = getNumVar("--fadeBlur", 1.6);

        const roleT = clamp(t * 2, 0, 1);
        const nameT = clamp((t - 0.5) * 2, 0, 1);

        root.style.setProperty("--roleY", String(-liftRole * (1 - roleT)) + "px");
        root.style.setProperty("--roleO", String(roleT));
        root.style.setProperty("--roleB", String((blurMax * 0.9) * (1 - roleT)) + "px");

        root.style.setProperty("--nameY", String(-liftName * (1 - nameT)) + "px");
        root.style.setProperty("--nameO", String(nameT));
        root.style.setProperty("--nameB", String(blurMax * (1 - nameT)) + "px");
      }

      function syncMobileHeroWithScroll(){
        if(!isMobileLayout()){
          mobileHeroLatchedHidden = false;
          lastMobileScrollY = window.scrollY || window.pageYOffset || 0;
          return;
        }
        if(animating) return;

        const firstCard = cards[0];
        if(!heroStage || !firstCard) return;

        const currentY = window.scrollY || window.pageYOffset || 0;
        const scrollingDown = currentY > (lastMobileScrollY + 0.5);
        const scrollingUp = currentY < (lastMobileScrollY - 0.5);
        lastMobileScrollY = currentY;

        const cardRect = firstCard.getBoundingClientRect();
        const heroRect = heroStage.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        const headerOffset = (topbar?.offsetHeight || 0) + 10;

        /*
          No mobile, o hero agora fica “travado” escondido quando o usuário segue descendo.
          Isso evita o micro-bug visual em que o nome parece descer de novo antes do card Sobre.
          O retorno só acontece quando a pessoa realmente sobe de volta para o hero.
        */
        const hideLatchPoint = Math.max(70, heroStage.offsetHeight * 0.24);
        const releaseLatchPoint = Math.max(18, heroStage.offsetHeight * 0.10);

        if(scrollingDown && currentY > hideLatchPoint){
          mobileHeroLatchedHidden = true;
        }else if(scrollingUp && currentY <= releaseLatchPoint){
          mobileHeroLatchedHidden = false;
        }

        const revealStart = headerOffset;
        const revealEnd = Math.max(revealStart + 1, Math.min(vh * 0.54, heroRect.height * 0.58));
        const raw = (cardRect.top - revealStart) / (revealEnd - revealStart);
        const t = clamp(raw, 0, 1);

        if(currentY <= (heroStage.offsetHeight + 80)){
          flowStarted = false;
          step = 0;
          clearAutoCard();
          clearAutoDesktopCard();
        }

        if(mobileHeroLatchedHidden && currentY > releaseLatchPoint){
          syncHeroReturnWithCardProgress(0);
          topbar.classList.add("show-brand");
          return;
        }

        syncHeroReverseStepSequence(t);
        topbar.classList.toggle("show-brand", t < 0.98);
      }

      function scheduleAutoRole(){
        if(step !== 1) return;
        if(autoRolePending) return;
        autoRolePending = true;

        const nameDur = stepDurationMs(1);
        autoRoleTimer = window.setTimeout(() => {
          autoRoleTimer = 0;
          autoRolePending = false;
          if(flowStarted) return;

          lockBody();
          animateToStep(2).then(() => unlockBody());
        }, Math.max(320, nameDur + 80));
      }

      function scheduleAutoCardHandoff(){
        if(!isMobileLayout()) return;
        if(step !== 2) return;
        if(autoCardPending) return;
        autoCardPending = true;

        const roleDur = stepDurationMs(2);
        const syncLead = mobileSyncLeadMs();
        autoCardTimer = window.setTimeout(() => {
          autoCardTimer = 0;
          autoCardPending = false;
          if(flowStarted || step !== 2 || animating) return;

          lockBody();
          handoffToCards();
        }, Math.max(60, roleDur + syncLead));
      }


      function scheduleAutoDesktopCardHandoff(){
        if(isMobileLayout()) return;
        if(step !== 2) return;
        if(autoDesktopCardPending) return;
        autoDesktopCardPending = true;

        autoDesktopCardTimer = window.setTimeout(() => {
          autoDesktopCardTimer = 0;
          autoDesktopCardPending = false;
          if(flowStarted || step !== 2 || animating) return;

          lockBody();
          step = 3;
          applyHeroState();
          setCooldown();
          handoffToCards();
        }, 2000);
      }

      function animateToStep(next){
        if(animating) return Promise.resolve();
        animating = true;

        const dur = stepDurationMs(next);
        step = clamp(next, 0, 3);

        applyHeroState();
        setCooldown();

        if(step === 1) scheduleAutoRole();
        else clearAutoRole();

        if(step === 2){
          scheduleAutoCardHandoff();
          scheduleAutoDesktopCardHandoff();
        }else{
          clearAutoCard();
          clearAutoDesktopCard();
        }

        return new Promise((resolve) => {
          window.setTimeout(() => {
            animating = false;

            if(step < 3) unlockBody();
            if(step >= 3) handoffToCards();
            resolve();
          }, dur + 40);
        });
      }

      function handleDelta(deltaY){
        const now = performance.now();
        if(now < cooldownUntil) return;

        const deadZone = Math.max(0, getNumVar("--deadZone", 2.5));
        if(Math.abs(deltaY) < deadZone) return;

        const dir = deltaY > 0 ? +1 : -1;
        if(lastDir !== 0 && dir !== lastDir) accum = 0;
        lastDir = dir;

        const down = Math.max(45, getNumVar("--stepDistanceDown", 320));
        const up   = Math.max(55, getNumVar("--stepDistanceUp", 380));

        accum += deltaY;

        if(accum >= down){
          accum = 0;

          if(step === 1 && autoRolePending) return;

          if(step < 3){
            lockBody();
            animateToStep(step + 1);
          }
          return;
        }

        if(accum <= -up){
          accum = 0;

          if(step === 1 && autoRolePending) clearAutoRole();
          if(step === 2 && autoDesktopCardPending) clearAutoDesktopCard();

          if(step > 0){
            lockBody();
            animateToStep(step - 1);
          }
          return;
        }
      }

      /* ========================= CARDS FLOW ========================= */
      let sceneIndex = 0;
      let phase = "closed";
      let lockedUntil = 0;

      let p = 0;
      let pTarget = 0;

      let pendingRestore = false;

      let raf = 0;
      let lastFrame = performance.now();

      let wheelAccum = 0;
      let wheelLast = performance.now();
      let wheelCooldownUntil = 0;

      let pendingDir = +1;
      let pendingNavIndex = null;
      let returnToHeroAfterClose = false;

      function originVector(code){
        const key = String(code || "ml").trim().toLowerCase();
        switch(key){
          case "tl": return { sx: -1, sy: -1 };
          case "tr": return { sx: +1, sy: -1 };
          case "mr": return { sx: +1, sy:  0 };
          case "bl": return { sx: -1, sy: +1 };
          case "ml":
          default:   return { sx: -1, sy:  0 };
        }
      }

      /* ✅ suavização mais “pluma” (mais lenta por frame) */
      function smoothAlpha(lag){
        const now = performance.now();
        const dt = Math.min(0.05, Math.max(0.008, (now - lastFrame) / 1000));
        lastFrame = now;

        // k menor => aproxima mais devagar (mais sedoso)
        const k = 8.0 * (1 - lag) + 2.8;
        return 1 - Math.exp(-k * dt);
      }

      function setActiveCardClass(){
        cards.forEach((c, i) => c.classList.toggle("is-active", flowStarted && i === sceneIndex && p >= 0.96));
      }

      function hideAllCards(){
        for(const c of cards){
          c.style.setProperty("--p","0");
          c.style.setProperty("--o","0");
          c.style.setProperty("--wPx","160");
          c.style.setProperty("--xPx","0");
          c.style.setProperty("--yPx","0");
          c.style.setProperty("--s","0.992");
          c.style.zIndex = "10";
        }
        setActiveCardClass();
      }

      function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }
      function easeOutQuad(t){ return 1 - (1 - t) * (1 - t); }
      function mix(a,b,t){ return a + (b - a) * t; }

      function applyCardStyles(activeCard, pNow){
        const vw = window.innerWidth || 1200;
        const vh = window.innerHeight || 800;

        const wFromVw = Math.max(4, getNumVar("--cardFromVw", 10));
        const wFullVw = Math.max(wFromVw, getNumVar("--cardFullVw", 92));
        const maxW = Math.max(760, getNumVar("--cardMaxW", 980));

        const wFromPx = vw * (wFromVw / 100);
        const wFullPx = Math.min(maxW, vw * (wFullVw / 100));

        const edgeX = Math.max(0, getNumVar("--edgeMargin", 46));
        const edgeY = Math.max(0, getNumVar("--edgeMarginY", 76));

        const origin = (activeCard.id === "sobre")
          ? { sx: -1, sy: 0 }
          : originVector(activeCard.dataset.origin);

        const tSlide = easeOutCubic(clamp(pNow, 0, 1));
        const tFade  = easeOutQuad(clamp((pNow - 0.05) / 0.95, 0, 1));

        const w = wFromPx + (wFullPx - wFromPx) * tSlide;

        const sideX = ((vw * 0.56) + (w * 0.50) + edgeX) * 0.68;
        const enterY = ((vh * 0.88) + edgeY) * 0.63;
        const exitY  = ((vh * 0.88) + edgeY) * 0.57;

        let x = 0;
        let y = 0;

        if(phase === "closing"){
          const tClose = easeOutCubic(clamp(1 - pNow, 0, 1));
          x = origin.sx * tClose * sideX;
          y = -tClose * exitY;
        } else {
          x = origin.sx * (1 - tSlide) * sideX;
          y = (1 - tSlide) * enterY;
        }

        const o = clamp(mix(0.02, 1.0, tFade), 0, 1);
        const s = 0.994 + 0.006 * tSlide;

        activeCard.style.setProperty("--p", pNow.toFixed(3));
        activeCard.style.setProperty("--o", o.toFixed(3));
        activeCard.style.setProperty("--wPx", w.toFixed(2));
        activeCard.style.setProperty("--xPx", x.toFixed(2));
        activeCard.style.setProperty("--yPx", y.toFixed(2));
        activeCard.style.setProperty("--s", s.toFixed(4));
        activeCard.style.zIndex = "30";

        setActiveCardClass();
      }

      function scheduleRender(){
        if(raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          render();
        });
      }

      function canTrigger(){
        if(prefersReduced()) return false;
        if(overlay.classList.contains("is-open")) return false;
        return performance.now() >= lockedUntil;
      }

      function setLock(){
        const ms = Math.max(120, getMsVar("--sceneLockMs", 1350));
        lockedUntil = performance.now() + ms;
      }

      function resetActiveScroll(){
        const active = cards[sceneIndex];
        if(!active) return;
        const sc = active.querySelector("[data-scroll]");
        if(sc) sc.scrollTop = 0;
      }

      function closeScene(){
        phase = "closing";
        pTarget = 0;
        scheduleRender();
      }

      function handoffToCards(){
        if(flowStarted) return;
        flowStarted = true;
        topbar.classList.add("show-brand");

        lockBody();

        const isMobile = isMobileLayout();
        const y = cardsTrack.getBoundingClientRect().top + window.scrollY;
        const mobileFrameOffset = (topbar?.offsetHeight || 0) + 10;

        // ✅ no mobile, enquadra o card certinho abaixo da topbar
        window.scrollTo({
          top: Math.max(0, isMobile ? (y - mobileFrameOffset) : (y + 1)),
          behavior: "auto"
        });

        sceneIndex = 0;
        pendingNavIndex = 0;
        updateNavActive(-1);
        pendingDir = +1;
        returnToHeroAfterClose = false;

        setLock();

        p = 0;
        pTarget = 0;
        phase = "closed";
        hideAllCards();
        resetActiveScroll();

        const enteringCard = isMobile ? cards[0] : null;
        if(enteringCard){
          enteringCard.classList.remove("mobile-handoff-enter");
          void enteringCard.offsetWidth;
        }

        requestAnimationFrame(() => {
          const startOpening = () => {
            p = 0;
            pTarget = 1;
            phase = "opening";
            scheduleRender();

            if(enteringCard){
              enteringCard.classList.add("mobile-handoff-enter");
              window.setTimeout(() => enteringCard.classList.remove("mobile-handoff-enter"), mobileCardEnterDurationMs() + 40);
            }

            unlockBody();
          };

          if(isMobile){
            window.setTimeout(startOpening, Math.max(0, mobileSyncLeadMs()));
          } else {
            startOpening();
          }
        });
      }

      async function returnToHeroWithSameMotion(){
        flowStarted = false;
        updateNavActive(-1);
        clearAutoRole();
        clearAutoCard();

        phase = "closed";
        p = 0;
        pTarget = 0;
        accum = 0;
        lastDir = 0;
        wheelAccum = 0;
        touchAccum = 0;
        pendingNavIndex = null;

        hideAllCards();
        topbar.classList.remove("show-brand");

        const home = document.getElementById("home");

        step = 0;
        animating = true;

        setHeroTransitionMode(false);
        syncHeroReturnWithCardProgress(1);
        window.scrollTo({ top: home.getBoundingClientRect().top + window.scrollY, behavior: "auto" });

        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        setCooldown();

        await new Promise(resolve => {
          window.setTimeout(() => {
            animating = false;
            setHeroTransitionMode(true);
            applyHeroState();
            unlockBody();
            resolve();
          }, 90);
        });
      }

      function requestNext(){
        if(!canTrigger()) return;
        if(phase === "opening") return;

        const lastIdx = cards.length - 1;
        const nextIndex = clamp(sceneIndex + 1, 0, lastIdx);

        setLock();
        pendingDir = +1;
        pendingNavIndex = nextIndex;
        returnToHeroAfterClose = false;
        closeScene();
      }

      function requestPrev(){
        if(!canTrigger()) return;
        if(phase === "opening") return;

        const lastIdx = cards.length - 1;
        const isFooterState = flowStarted && phase === "closed" && p === 0 && sceneIndex === lastIdx;

        if(isFooterState){
          const footer = document.getElementById("siteFooter");
          if(footer){
            footer.classList.remove("is-visible");
            footer.classList.add("is-hiding");
          }
          setLock();
          pendingDir = 0;
          pendingNavIndex = sceneIndex;
          returnToHeroAfterClose = false;
          phase = "opening";
          p = 0;
          pTarget = 1;
          resetActiveScroll();
          scheduleRender();
          return;
        }

        if(sceneIndex === 0){
          setLock();
          pendingDir = -1;
          pendingNavIndex = -1;
          returnToHeroAfterClose = true;
          closeScene();
          return;
        }

        const prevIndex = clamp(sceneIndex - 1, 0, cards.length - 1);

        setLock();
        pendingDir = -1;
        pendingNavIndex = prevIndex;
        returnToHeroAfterClose = false;
        closeScene();
      }

      function render(){
        if(prefersReduced()){
          hideAllCards();
          if(flowStarted){
            const c = cards[sceneIndex] || cards[0];
            c.style.setProperty("--p","1");
            c.style.setProperty("--o","1");
            c.style.setProperty("--wPx","760");
            c.style.setProperty("--xPx","0");
            c.style.setProperty("--yPx","0");
            c.style.setProperty("--s","1");
            c.style.zIndex = "30";
            setActiveCardClass();
          }
          return;
        }

        const aCard = smoothAlpha(clamp(getNumVar("--cardLag", 0.55), 0.18, 0.72));

        p = p + (pTarget - p) * aCard;
        if(Math.abs(p - pTarget) < 0.0014) p = pTarget;

        hideAllCards();

        if(flowStarted && !pendingRestore){
          const active = cards[sceneIndex];
          if(active && (phase === "opening" || phase === "open" || phase === "closing")){
            applyCardStyles(active, p);
          }
        }

        if(phase === "opening"){
          if(pendingNavIndex !== null && p >= 0.72){
            updateNavActive(pendingNavIndex);
          }

          if(p >= 1){
            phase = "open";
            updateNavActive(sceneIndex);
            pendingNavIndex = null;
          }
        }

        if(phase === "closing" && returnToHeroAfterClose){
          topbar.classList.remove("show-brand");
          setHeroTransitionMode(false);
          syncHeroReturnWithCardProgress(1 - p);

          if(pendingNavIndex === -1 && p <= 0.28){
            updateNavActive(-1);
          }
        }

        if(phase === "closing" && p <= 0){
          if(returnToHeroAfterClose){
            returnToHeroAfterClose = false;
            phase = "closed";
            p = 0; pTarget = 0;
            hideAllCards();
            returnToHeroWithSameMotion();
            return;
          }

          const nextIdx = clamp(sceneIndex + pendingDir, 0, cards.length - 1);
          if(nextIdx !== sceneIndex){
            sceneIndex = nextIdx;
            phase = "opening";
            pTarget = 1;
            resetActiveScroll();
          } else {
            phase = "closed";
            pendingNavIndex = null;
          }
        }

        const needsMore =
          Math.abs(p - pTarget) > 0.001 ||
          phase === "opening" || phase === "closing";

        if(needsMore) scheduleRender();
      }

      function scaledWheelDelta(e){
        let dy = e.deltaY;
        if(e.deltaMode === 1) dy *= 16;
        else if(e.deltaMode === 2) dy *= (window.innerHeight || 800);
        const base = clamp(getNumVar("--wheelScale", 0.55), 0.2, 1.2);
        return dy * base;
      }

      function tryScrollInsideActiveCard(dy){
        const active = cards[sceneIndex];
        if(!active) return { used: false, atEdge: true };

        if(isMobileLayout() && mobileOpenCard !== active){
          return { used: false, atEdge: true };
        }

        const sc = active.querySelector("[data-scroll]");
        if(!sc) return { used: false, atEdge: true };

        const style = window.getComputedStyle(sc);
        const canOverflow = /(auto|scroll)/.test(style.overflowY) || /(auto|scroll)/.test(style.overflow);
        if(isMobileLayout() && !canOverflow){
          return { used: false, atEdge: true };
        }

        const max = sc.scrollHeight - sc.clientHeight;
        const hasScroll = max > 2;
        if(!hasScroll) return { used: false, atEdge: true };

        const before = sc.scrollTop;
        sc.scrollTop = clamp(before + dy, 0, max);
        const after = sc.scrollTop;

        const moved = Math.abs(after - before) > 0.5;

        const atTop = after <= 0.5;
        const atBottom = after >= (max - 0.5);
        const atEdge = dy > 0 ? atBottom : atTop;

        return { used: true, moved, atEdge };
      }

      window.addEventListener("wheel", (e) => {
        if(document.body.classList.contains("is-loading")) return;
        if(overlay.classList.contains("is-open")) return;

        if(isMobileLayout() && flowStarted){
          return;
        }

        if(flowStarted && !prefersReduced()){
          if(e.ctrlKey) return;
          e.preventDefault();

          const now = performance.now();
          const dy = scaledWheelDelta(e);

          const res = tryScrollInsideActiveCard(dy);
          if(res.used && res.moved){
            scheduleRender();
            return;
          }

          const dt = now - wheelLast;
          wheelLast = now;
          if(dt > 160) wheelAccum = 0;

          wheelAccum += dy;

          const trigger = Math.max(70, getNumVar("--wheelTrigger", 135));
          const allowKnob = (!res.used) || (res.used && res.atEdge);

          if(allowKnob && Math.abs(wheelAccum) >= trigger){
            const wNow = performance.now();
            if(wNow >= wheelCooldownUntil){
              if(wheelAccum > 0) requestNext();
              else requestPrev();
              wheelCooldownUntil = wNow + 1000;
            }
            wheelAccum = 0;
          }

          scheduleRender();
          return;
        }

        if(flowStarted) return;
        if(!inHeroViewport()) return;

        e.preventDefault();
        lockBody();
        handleDelta(e.deltaY);
      }, { passive: false });

      let touchY = null;
      let touchAccum = 0;

      window.addEventListener("touchstart", (e) => {
        if(document.body.classList.contains("is-loading")) return;
        if(e.touches && e.touches.length){
          touchY = e.touches[0].clientY;
          touchAccum = 0;
        }
      }, { passive: true });

      window.addEventListener("touchmove", (e) => {
        if(document.body.classList.contains("is-loading")) return;
        if(overlay.classList.contains("is-open")) return;
        if(touchY == null) return;

        const yy = (e.touches && e.touches.length) ? e.touches[0].clientY : touchY;
        const dy = touchY - yy;
        touchY = yy;

        if(isMobileLayout() && flowStarted){
          return;
        }

        if(flowStarted && !prefersReduced()){
          e.preventDefault();

          const res = tryScrollInsideActiveCard(dy);
          if(res.used && res.moved){
            scheduleRender();
            return;
          }

          touchAccum += dy;
          const TRIGGER = 70;

          const allowKnob = (!res.used) || (res.used && res.atEdge);
          if(allowKnob && Math.abs(touchAccum) >= TRIGGER){
            if(touchAccum > 0) requestNext();
            else requestPrev();
            touchAccum = 0;
          }

          scheduleRender();
          return;
        }

        if(!flowStarted && inHeroViewport() && !mobileHeroLatchedHidden){
          e.preventDefault();
          lockBody();
          handleDelta(dy * 1.75);
        }
      }, { passive: false });

      window.addEventListener("touchend", () => { touchY = null; touchAccum = 0; }, { passive: true });

      function isTypingContext(){
        const el = document.activeElement;
        if(!el) return false;
        const tag = (el.tagName || "").toUpperCase();
        return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
      }

      let keyboardStepArmedDir = 0;
      let keyboardStepArmedAt = 0;
      const KEYBOARD_STEP_WINDOW = 900;

      function consumeKeyboardStep(dir){
        const now = Date.now();
        if(keyboardStepArmedDir !== dir || (now - keyboardStepArmedAt) > KEYBOARD_STEP_WINDOW){
          keyboardStepArmedDir = dir;
          keyboardStepArmedAt = now;
          return false;
        }
        keyboardStepArmedDir = 0;
        keyboardStepArmedAt = 0;
        return true;
      }

      function clearKeyboardStepArm(){
        keyboardStepArmedDir = 0;
        keyboardStepArmedAt = 0;
      }

      function handleKeyboardDirection(dir){
        if(document.body.classList.contains("is-loading")) return false;
        if(overlay.classList.contains("is-open")) return false;
        if(isTypingContext()) return false;

        clearNavVisualFocus();

        if(!consumeKeyboardStep(dir)) return true;

        if(flowStarted && !prefersReduced()){
          if(dir > 0){
            clearKeyboardStepArm();
            requestNext();
          }else{
            clearKeyboardStepArm();
            requestPrev();
          }
          scheduleRender();
          return true;
        }

        if(flowStarted) return false;
        if(!inHeroViewport()) return false;

        lockBody();

        if(dir > 0){
          handleDelta(Math.max(
            getNumVar("--stepDistanceDown", 320) + 12,
            getNumVar("--wheelTrigger", 135) + 18
          ));
        }else{
          handleDelta(-Math.max(
            getNumVar("--stepDistanceUp", 380) + 12,
            getNumVar("--wheelTrigger", 135) + 18
          ));
        }

        return true;
      }

      window.addEventListener("scroll", () => {
        syncMobileHeroWithScroll();
      }, { passive:true });

      window.addEventListener("keydown", (e) => {
        if(document.body.classList.contains("is-loading")) return;

        if(overlay.classList.contains("is-open")){
          if(e.key === "Escape"){
            e.preventDefault();
            clearKeyboardStepArm();
            closeMenu();
          }
          return;
        }

        if(e.key === "Escape" && mobileOpenCard){
          e.preventDefault();
          closeMobileCardModal();
          return;
        }

        if(isTypingContext()) return;

        if(["ArrowDown", "PageDown"].includes(e.key)){
          if(handleKeyboardDirection(+1)) e.preventDefault();
          return;
        }

        if(["ArrowUp", "PageUp"].includes(e.key)){
          if(handleKeyboardDirection(-1)) e.preventDefault();
          return;
        }

        if(e.key === " " || e.code === "Space"){
          if(handleKeyboardDirection(e.shiftKey ? -1 : +1)) e.preventDefault();
          return;
        }

        if(e.key === "Home"){
          e.preventDefault();
          clearKeyboardStepArm();
          closeMenu();
          unlockBody();
          goToScene(-1);
          return;
        }

        if(e.key === "End"){
          e.preventDefault();
          clearKeyboardStepArm();
          closeMenu();
          unlockBody();
          goToScene(cards.length - 1);
        }
      });

      window.addEventListener("wheel", clearKeyboardStepArm, { passive:true });
      window.addEventListener("touchstart", clearKeyboardStepArm, { passive:true });
      window.addEventListener("mousedown", clearKeyboardStepArm, { passive:true });

      window.addEventListener("resize", () => {
        scheduleRender();
        window.setTimeout(setupMobileCardModals, 80);
        if(!isMobileLayout()) closeMobileCardModal({ restoreFocus: false });
        window.setTimeout(syncMobileHeroWithScroll, 30);
      }, { passive:true });
      window.addEventListener("orientationchange", () => {
        setTimeout(scheduleRender, 120);
        setTimeout(setupMobileCardModals, 180);
        if(!isMobileLayout()) closeMobileCardModal({ restoreFocus: false });
        setTimeout(syncMobileHeroWithScroll, 220);
      }, { passive:true });

      function goToScene(i){
        if(i < 0){
          pendingNavIndex = -1;
          returnToHeroWithSameMotion();
          return;
        }

        if(!flowStarted){
          clearAutoRole();
          step = 3;
          applyHeroState();
          flowStarted = true;
          topbar.classList.add("show-brand");
        }

        sceneIndex = clamp(i, 0, cards.length - 1);
        pendingNavIndex = sceneIndex;
        returnToHeroAfterClose = false;

        setLock();
        p = 0; pTarget = 1;
        phase = "opening";

        const y = cardsTrack.getBoundingClientRect().top + window.scrollY;
        const mobileOffset = (topbar?.offsetHeight || 0) + 10;
        window.scrollTo({ top: Math.max(0, y - (isMobileLayout() ? mobileOffset : -1)), behavior: "smooth" });

        resetActiveScroll();
        scheduleRender();

        if(isMobileLayout()){
          window.setTimeout(() => {
            const targetCard = cards[sceneIndex];
            if(targetCard) openMobileCardModal(targetCard, targetCard);
          }, 180);
        }
      }

      function handleMobileMenuNavigation(link){
        const href = link.getAttribute("href") || "";
        const target = href.startsWith("#") ? document.querySelector(href) : null;

        closeMenu();
        unlockBody();

        if(!target) return;

        if(href === "#home"){
          closeMobileCardModal({ restoreFocus: false });
          window.setTimeout(() => {
            returnToHeroWithSameMotion();
          }, 80);
          return;
        }

        closeMobileCardModal({ restoreFocus: false });

        const mobileOffset = (topbar?.offsetHeight || 0) + 16;
        window.setTimeout(() => {
          const y = target.getBoundingClientRect().top + window.scrollY - mobileOffset;
          window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
          window.setTimeout(() => openMobileCardModal(target, link), 220);
        }, 80);
      }

      links.forEach((a, idx) => a.style.setProperty("--i", String(idx)));
      links.forEach(a => a.addEventListener("click", (e) => {
        e.preventDefault();

        if(isMobileLayout()){
          handleMobileMenuNavigation(a);
          return;
        }

        const idx = parseInt(a.dataset.index || "-1", 10);
        updateNavActive(idx);
        closeMenu();
        unlockBody();
        requestAnimationFrame(() => setTimeout(() => goToScene(idx), 40));
      }));


      function setupContactForm(){
        const form = document.getElementById("contactForm");
        if(!form || form.dataset.bound === "true") return;

        const status = document.getElementById("contactStatus");
        const submitBtn = form.querySelector("[data-contact-submit]");
        const whatsappBtn = document.getElementById("contactWhatsappBtn");
        const messageField = form.elements.message;
        const messageCounter = document.getElementById("contactMessageCounter");
        const messageCounterWrap = messageCounter?.closest(".field-counter") || null;
        let successToastTimer = null;

        const getSuccessToast = () => document.getElementById("contactSuccessToast");
        const recipientEmail = String(form.dataset.recipient || "contato@terapiacomkaren.com").trim();
        const endpoint = form.getAttribute("action") || form.dataset.endpoint || `https://formsubmit.co/ajax/${recipientEmail}`;
        const whatsappTarget = String(form.dataset.whatsapp || "").replace(/\D/g, "");

        const setStatus = (message, tone = "error") => {
          if(!status) return;
          status.textContent = message;
          status.classList.toggle("is-ok", tone === "ok");
          status.classList.toggle("is-warn", tone === "warn");
        };

        const updateMessageCounter = () => {
          if(!messageField || !messageCounter) return;
          const current = String(messageField.value || "").length;
          messageCounter.textContent = String(current);
          if(messageCounterWrap){
            messageCounterWrap.classList.toggle("is-limit", current >= 450);
          }
        };

        updateMessageCounter();
        if(messageField){
          messageField.addEventListener("input", updateMessageCounter);
        }

        const showSuccessToast = () => {
          const successToast = getSuccessToast();
          if(!successToast) return;
          window.clearTimeout(successToastTimer);
          successToast.classList.remove("is-visible");
          void successToast.offsetWidth;
          successToast.classList.add("is-visible");
          successToastTimer = window.setTimeout(() => {
            successToast.classList.remove("is-visible");
          }, 3000);
        };

        const setBusy = (busy) => {
          if(submitBtn){
            submitBtn.disabled = busy;
            submitBtn.textContent = busy ? "Enviando..." : "Enviar por e-mail";
          }
          if(whatsappBtn) whatsappBtn.disabled = busy;
        };

        const sanitizeText = (value, max = 1500) =>
          String(value || "")
            .replace(/[<>]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, max);

        const collectData = () => ({
          name: sanitizeText(form.elements.name?.value, 80),
          email: sanitizeText(form.elements.email?.value, 120).toLowerCase(),
          phone: sanitizeText(form.elements.phone?.value, 20),
          phone_is_whatsapp: Boolean(form.elements.phone_is_whatsapp?.checked),
          reason: sanitizeText(form.elements.reason?.value || "Agendar sessão", 80),
          message: sanitizeText(form.elements.message?.value, 1500),
          website: sanitizeText(form.elements.website?.value, 120)
        });

        const validate = (data) => {
          if(data.website){
            setStatus("Envio bloqueado.", "warn");
            return false;
          }

          if(!form.reportValidity()){
            setStatus("Confira os campos obrigatórios antes de enviar.");
            return false;
          }

          if(!data.name || data.name.length < 2){
            setStatus("Preencha seu nome para continuar.");
            return false;
          }

          const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
          if(!emailOk){
            setStatus("Confira o e-mail informado antes de enviar.");
            return false;
          }

          if(data.phone && data.phone.replace(/\D/g, "").length < 10){
            setStatus("Confira o telefone informado antes de enviar.");
            return false;
          }

          if(!data.message || data.message.length < 10){
            setStatus("Escreva uma mensagem um pouco mais completa antes de enviar.");
            return false;
          }

          if(data.message.length > 500){
            setStatus("A mensagem pode ter no máximo 500 caracteres.");
            return false;
          }

          setStatus("");
          return true;
        };


        if(whatsappBtn){
          whatsappBtn.addEventListener("click", () => {
            const data = collectData();
            if(!validate(data)) return;

            if(!whatsappTarget){
              setStatus("O botão do WhatsApp já está pronto no layout, mas o número ainda precisa ser configurado no arquivo.", "warn");
              return;
            }

            const chunks = [
              `Olá, me chamo ${data.name}.`,
              `Motivo do contato: ${data.reason}.`,
              data.phone ? `Telefone: ${data.phone}${data.phone_is_whatsapp ? ' (WhatsApp)' : ''}.` : "",
              data.email ? `E-mail: ${data.email}.` : "",
              data.message
            ].filter(Boolean);

            const message = encodeURIComponent(chunks.join("\n"));
            window.open(`https://wa.me/${whatsappTarget}?text=${message}`, "_blank", "noopener");
            setStatus("Abrindo WhatsApp...", "ok");
          });
        }

        form.addEventListener("submit", async (e) => {
          e.preventDefault();

          const data = collectData();
          if(!validate(data)) return;

          setBusy(true);
          setStatus("Enviando mensagem...", "warn");

          const payload = {
            name: data.name,
            email: data.email,
            phone: data.phone,
            phone_is_whatsapp: data.phone_is_whatsapp ? "Sim" : "Não",
            reason: data.reason,
            message: data.message,
            _subject: "Novo contato pelo site - Karen Patussi",
            _replyto: data.email,
            _captcha: "false",
            _honey: "",
            _template: "table"
          };

          try {
            const response = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
              },
              body: JSON.stringify(payload)
            });

            let result = null;
            try {
              result = await response.json();
            } catch(_jsonError) {}

            if(response.ok && (!result || result.success !== false)){
              form.reset();
              setStatus("");
              showSuccessToast();
              return;
            }

            const fallbackBody = encodeURIComponent([
              `Nome: ${data.name}`,
              `Motivo: ${data.reason}`,
              data.phone ? `Telefone: ${data.phone}${data.phone_is_whatsapp ? ' (WhatsApp)' : ''}` : "",
              `E-mail: ${data.email}`,
              "",
              data.message
            ].filter(Boolean).join("\n"));

            window.location.href = `mailto:${recipientEmail}?subject=${encodeURIComponent(`Contato pelo site — ${data.reason}`)}&body=${fallbackBody}`;
            setStatus("Não consegui enviar direto pelo formulário, então abri seu aplicativo de e-mail como plano B.", "warn");
          } catch (error) {
            const fallbackBody = encodeURIComponent([
              `Nome: ${data.name}`,
              `Motivo: ${data.reason}`,
              data.phone ? `Telefone: ${data.phone}${data.phone_is_whatsapp ? ' (WhatsApp)' : ''}` : "",
              `E-mail: ${data.email}`,
              "",
              data.message
            ].filter(Boolean).join("\n"));

            window.location.href = `mailto:${recipientEmail}?subject=${encodeURIComponent(`Contato pelo site — ${data.reason}`)}&body=${fallbackBody}`;
            setStatus("Não consegui enviar direto pelo formulário, então abri seu aplicativo de e-mail como plano B.", "warn");
          } finally {
            setBusy(false);
          }
        });

        form.dataset.bound = "true";
      }



      function enforceDesktopReloadAtTop(){
        if(isMobileLayout()) return;
        try{
          if("scrollRestoration" in history){
            history.scrollRestoration = "manual";
          }
        }catch(_e){}
        window.scrollTo(0, 0);
        flowStarted = false;
        step = 0;
        phase = "closed";
        p = 0;
        pTarget = 0;
        sceneIndex = 0;
        pendingDir = +1;
        returnToHeroAfterClose = false;
        clearAutoRole();
        clearAutoCard();
        clearAutoDesktopCard();
        hideAllCards();
        applyHeroState();
        updateNavActive(-1);
      }

      setupContactForm();
      applyHeroState();
      hideAllCards();
      enforceDesktopReloadAtTop();
      scheduleRender();
      window.setTimeout(setupMobileCardModals, 60);
      window.setTimeout(syncMobileHeroWithScroll, 60);
      window.addEventListener("load", () => {
        enforceDesktopReloadAtTop();
        window.setTimeout(setupMobileCardModals, 120);
        window.setTimeout(syncMobileHeroWithScroll, 140);
      }, { once: true });

      window.addEventListener("pageshow", () => {
        enforceDesktopReloadAtTop();
      });

      // API interna exposta para o bloco do rodapé
      function triggerSameStep(dir){
        const direction = dir > 0 ? 1 : -1;

        if(flowStarted){
          if(direction > 0){
            requestNext();
          }else{
            requestPrev();
          }
          return;
        }

        if(animating) return;

        if(direction > 0){
          if(step === 1 && autoRolePending) return;
          if(step < 3){
            lockBody();
            animateToStep(step + 1);
          }
          return;
        }

        if(step === 1 && autoRolePending) clearAutoRole();
        if(step === 2 && autoDesktopCardPending) clearAutoDesktopCard();

        if(step > 0){
          lockBody();
          animateToStep(step - 1);
        }
      }

      window.__siteNav = {
        isFooterState:  () => flowStarted && phase === "closed" && p === 0 && sceneIndex === cards.length - 1,
        restoreLastCard:() => {
          if(!flowStarted) return;
          const footer = document.getElementById("siteFooter");
          if(footer){
            footer.classList.remove("is-visible");
            footer.classList.add("is-hiding");
          }
          pendingRestore = true;
          window.setTimeout(() => {
            pendingRestore = false;
            p = 0; pTarget = 1; phase = "opening";
            scheduleRender();
          }, 800);
        },
        next: () => triggerSameStep(+1),
        prev: () => triggerSameStep(-1),
        nextByButton: () => {
          if(flowStarted){
            requestNext();
            return;
          }
          if(animating || buttonHeroAdvanceRunning) return;

          buttonHeroAdvanceRunning = true;
          clearAutoRole();
          clearAutoCard();
          clearAutoDesktopCard();
          lockBody();

          animateToStep(1)
            .then(() => {
              if(flowStarted || step !== 1) return;
              lockBody();
              return animateToStep(2);
            })
            .then(() => {
              if(flowStarted || step !== 2) return;
              clearAutoRole();
              clearAutoCard();
              clearAutoDesktopCard();
              lockBody();
              step = 3;
              applyHeroState();
              setCooldown();
              handoffToCards();
            })
            .finally(() => {
              buttonHeroAdvanceRunning = false;
            });
        },
        prevByButton: () => {
          if(animating) return;

          if(flowStarted){
            if(phase === "opening") return;

            if(sceneIndex > 0){
              requestPrev();
              return;
            }

            clearAutoRole();
            clearAutoCard();
            clearAutoDesktopCard();
            setLock();
            pendingDir = -1;
            pendingNavIndex = -1;
            returnToHeroAfterClose = true;
            closeScene();
            return;
          }

          clearAutoRole();
          clearAutoCard();
          clearAutoDesktopCard();
          step = 0;
          applyHeroState();
          setCooldown();
          unlockBody();
        },
        // Estado em tempo real para o rodapé
        getState: () => ({
          flowStarted,
          phase,
          p,
          pTarget,
          sceneIndex,
          lastIdx: cards.length - 1,
          pendingDir
        })
      };
    })();
  
// voltar para o hero ao clicar no nome da barra / marca do menu
(function(){
  const barTitle = document.getElementById("barTitle");
  const drawerBrand = document.getElementById("drawerBrand");

  function isMobileLayoutOutside(){
    return window.matchMedia("(max-width: 980px)").matches;
  }

  function goHome(){
    const selector = isMobileLayoutOutside()
      ? '.drawer-nav a[href="#home"][data-link]'
      : '.main-nav a[href="#home"][data-link]';

    const homeLink = document.querySelector(selector) || document.querySelector('a[href="#home"][data-link]');
    if(homeLink){
      homeLink.click();
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  [barTitle, drawerBrand].forEach((el) => {
    if(!el) return;
    el.style.cursor = "pointer";
    el.addEventListener("click", goHome);
    el.addEventListener("keydown", (e) => {
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        goHome();
      }
    });
  });
})();

// ========================= RODAPÉ =========================
// Aparece SOMENTE quando o card "Agendar sessão" fecha completamente indo para frente.
// Usa o estado interno do sistema de navegação (via __siteNav.getState).
(function(){
  const footer = document.getElementById("siteFooter");
  const topbar = document.getElementById("topbar");
  if(!footer) return;

  function showFooter(){ footer.classList.remove("is-hiding"); footer.classList.add("is-visible"); }
  function hideFooter(){ footer.classList.remove("is-visible"); }
  function isFooterVisible(){ return footer.classList.contains("is-visible"); }

  // Retorna true quando o estado é definitivo (para o loop)
  function evaluate(){
    const nav = window.__siteNav;
    if(!nav) return false;
    const { flowStarted, phase, p, sceneIndex, lastIdx, pendingDir } = nav.getState();

    // No hero (sem flow): mostra o rodapé
    if(!flowStarted || (topbar && !topbar.classList.contains("show-brand"))){
      showFooter();
      return true; // estado estável — pode parar
    }

    // Rodapé aparece assim que o último card começa a sair (phase closing ou já fechado)
    const isAtEnd  = sceneIndex === lastIdx && (phase === "closing" || phase === "closed") && pendingDir !== -1;
    const goingBack = pendingDir === -1 && sceneIndex > 0;

    if(isAtEnd && !goingBack){
      showFooter();
      return phase === "closed" && p === 0;
    }

    hideFooter();
    return false; // ainda em transição — continua o loop
  }

  // Polling que para automaticamente quando o estado se estabiliza
  let rafId = null;
  function startPolling(){
    if(rafId) return;
    function loop(){
      const stable = evaluate();
      if(stable){
        rafId = null;
        return; // cancela o loop — MutationObserver reinicia se precisar
      }
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);
  }

  // Reinicia polling a cada mudança de classe nos cards ou topbar
  const allCards = Array.from(document.querySelectorAll("[data-card]"));
  const observer = new MutationObserver(() => {
    if(rafId) cancelAnimationFrame(rafId);
    rafId = null;
    startPolling();
  });
  allCards.forEach(c =>
    observer.observe(c, { attributes: true, attributeFilter: ["style", "class"] })
  );
  if(topbar){
    observer.observe(topbar, { attributes: true, attributeFilter: ["class"] });
  }

  // ── Patch: quando rodapé visível, primeiro scroll restaura o card de Contato ──
  function handleBackIntent(){
    if(!isFooterVisible()) return;
    const nav = window.__siteNav;
    if(nav && nav.isFooterState()) nav.restoreLastCard();
  }

  window.addEventListener("wheel", (e) => {
    if(isFooterVisible() && e.deltaY < 0) handleBackIntent();
  }, { capture: true, passive: true });

  window.addEventListener("keydown", (e) => {
    if(!isFooterVisible()) return;
    if(["ArrowUp","ArrowLeft","PageUp"].includes(e.key)) handleBackIntent();
  }, { capture: true });

  let touchStartY = null;
  window.addEventListener("touchstart", (e) => {
    if(isFooterVisible() && e.touches.length) touchStartY = e.touches[0].clientY;
  }, { capture: true, passive: true });
  window.addEventListener("touchmove", (e) => {
    if(!isFooterVisible() || touchStartY === null) return;
    if(e.touches[0].clientY - touchStartY > 30){ handleBackIntent(); touchStartY = null; }
  }, { capture: true, passive: true });

  startPolling();
})();


(function(){
  const root = document.querySelector('#como-funciona');
  if(!root) return;

  const tabs = root.querySelectorAll('[data-cf-tab]');
  const panes = root.querySelectorAll('[data-cf-pane]');
  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabs.forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      panes.forEach((p) => p.classList.remove('is-active'));
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      const pane = root.querySelector('[data-cf-pane="' + btn.dataset.cfTab + '"]');
      if(pane) pane.classList.add('is-active');
    });
  });

  const subtabs = root.querySelectorAll('[data-cf-approach]');
  const subpanes = root.querySelectorAll('[data-cf-approach-pane]');
  subtabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      subtabs.forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      subpanes.forEach((p) => p.classList.remove('is-active'));
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      const pane = root.querySelector('[data-cf-approach-pane="' + btn.dataset.cfApproach + '"]');
      if(pane) pane.classList.add('is-active');
    });
  });

  const mobileQuery = window.matchMedia('(max-width: 979.98px)');

  const syncCfState = () => {
    root.querySelectorAll('.cf-item').forEach((item) => {
      const btn = item.querySelector('.cf-question');
      if(!btn) return;
      const isOpen = item.classList.contains('is-open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  };

  root.querySelectorAll('.cf-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.cf-item');
      if(!item) return;
      item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', item.classList.contains('is-open') ? 'true' : 'false');
    });
  });

  if(typeof mobileQuery.addEventListener === 'function'){
    mobileQuery.addEventListener('change', syncCfState);
  } else if(typeof mobileQuery.addListener === 'function'){
    mobileQuery.addListener(syncCfState);
  }

  syncCfState();
})();

(function(){
  const root = document.querySelector('#areas-de-atuacao');
  if(!root) return;

  const mobileQuery = window.matchMedia('(max-width: 979.98px)');
  const syncAreasState = () => {
    root.querySelectorAll('.area-item').forEach((item) => {
      const btn = item.querySelector('.area-question');
      if(!btn) return;
      if(mobileQuery.matches){
        const isOpen = item.classList.contains('is-open');
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      } else {
        item.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  };

  root.querySelectorAll('.area-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      if(!mobileQuery.matches) return;
      const item = btn.closest('.area-item');
      if(!item) return;
      item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', item.classList.contains('is-open') ? 'true' : 'false');
    });
  });

  if(typeof mobileQuery.addEventListener === 'function'){
    mobileQuery.addEventListener('change', syncAreasState);
  } else if(typeof mobileQuery.addListener === 'function'){
    mobileQuery.addListener(syncAreasState);
  }

  syncAreasState();
})();

(function(){
  function initSceneControls(){
    const controls = document.querySelector('.scene-controls');
    const prevBtn = document.getElementById('scenePrev');
    const nextBtn = document.getElementById('sceneNext');
    if(!controls || !prevBtn || !nextBtn) return false;

    if(controls.dataset.sceneControlsBound === 'true') return true;
    controls.dataset.sceneControlsBound = 'true';

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const runSceneCommand = (dir) => {
    const nav = window.__siteNav;
    if(!nav) return;

    const button = dir > 0 ? nextBtn : prevBtn;
    if(button && button.getAttribute('aria-disabled') === 'true') return;

    if(dir > 0){
      if(typeof nav.nextByButton === 'function'){
        nav.nextByButton();
        return;
      }
      if(typeof nav.next === 'function') nav.next();
      return;
    }

    if(typeof nav.prevByButton === 'function'){
      nav.prevByButton();
      return;
    }
    if(typeof nav.prev === 'function') nav.prev();
  };

  const handleSceneButtonActivate = (dir) => (event) => {
    event.preventDefault();
    event.stopPropagation();
    runSceneCommand(dir);
  };

  /*
    Os botões do hero precisam disparar exatamente o mesmo fluxo do mouse,
    sem duplicar o comando. Antes o mesmo botão respondia em `click` e `pointerup`,
    o que gerava acionamento duplo em desktop.
  */
  prevBtn.addEventListener('click', handleSceneButtonActivate(-1));
  nextBtn.addEventListener('click', handleSceneButtonActivate(1));

  [prevBtn, nextBtn].forEach((btn, index) => {
    btn.addEventListener('keydown', (event) => {
      if(event.key === 'Enter' || event.key === ' '){
        event.preventDefault();
        event.stopPropagation();
        runSceneCommand(index === 0 ? -1 : 1);
      }
    });
  });

  let scrollTimer = null;
  let lastY = window.scrollY || window.pageYOffset || 0;
  let targetShift = 0;
  let currentShift = 0;
  let targetTilt = 0;
  let currentTilt = 0;
  let targetPrevShift = 0;
  let currentPrevShift = 0;
  let targetNextShift = 0;
  let currentNextShift = 0;
  let rafId = 0;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const render = () => {
    currentShift += (targetShift - currentShift) * 0.12;
    currentTilt += (targetTilt - currentTilt) * 0.12;
    currentPrevShift += (targetPrevShift - currentPrevShift) * 0.14;
    currentNextShift += (targetNextShift - currentNextShift) * 0.14;

    controls.style.setProperty('--controlsShiftY', `${currentShift.toFixed(2)}px`);
    controls.style.setProperty('--controlsTilt', `${currentTilt.toFixed(2)}deg`);
    prevBtn.style.setProperty('--sceneBtnShiftY', `${currentPrevShift.toFixed(2)}px`);
    nextBtn.style.setProperty('--sceneBtnShiftY', `${currentNextShift.toFixed(2)}px`);

    const settling =
      Math.abs(targetShift - currentShift) < 0.08 &&
      Math.abs(targetTilt - currentTilt) < 0.08 &&
      Math.abs(targetPrevShift - currentPrevShift) < 0.08 &&
      Math.abs(targetNextShift - currentNextShift) < 0.08;

    if(!settling){
      rafId = window.requestAnimationFrame(render);
    }else{
      rafId = 0;
    }
  };

  const tick = () => {
    if(!rafId) rafId = window.requestAnimationFrame(render);
  };

  const handleScrollReaction = () => {
    const y = window.scrollY || window.pageYOffset || 0;
    const delta = y - lastY;
    lastY = y;

    const shift = clamp(delta * 0.22, -7, 7);
    const tilt = clamp(delta * 0.05, -1.8, 1.8);
    const btnShift = clamp(delta * 0.18, -4, 4);

    targetShift = shift;
    targetTilt = tilt;
    targetPrevShift = clamp(-btnShift, -4, 4);
    targetNextShift = clamp(btnShift, -4, 4);

    controls.classList.add('is-scrolling');
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      controls.classList.remove('is-scrolling');
      targetShift = 0;
      targetTilt = 0;
      targetPrevShift = 0;
      targetNextShift = 0;
      tick();
    }, 170);
    tick();
  };

    window.addEventListener('scroll', handleScrollReaction, { passive: true });
    return true;
  }

  if(!initSceneControls()){
    window.addEventListener('DOMContentLoaded', initSceneControls, { once: true });
    window.addEventListener('load', initSceneControls, { once: true });
  }
})();
