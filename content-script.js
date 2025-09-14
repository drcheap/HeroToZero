const PLACEHOLDER_WIDTH = 16;
const PLACEHOLDER_HEIGHT = 16;
const PLACEHOLDER_TEXT = "Hero image replaced by HeroToZero";
const PLACEHOLDER_TEXT_RESTORE = "Click to restore orignal.";

let _didDestroy = false;
let _imgCount = 0;
let _hero = null;
let _zero = null;

function h2zCheck()
{
   console.debug("H2Z CS checking site ...");

   browser.runtime.sendMessage({ msgType: MSGTYPE_GET_SITE_CONFIG, url: window.location.href }).then(response => {
      console.debug("H2Z CS Received response:", response);
      if(response.ready && response.isSiteDestroying)
      {
         // We will try a few times, because some sites load content lazily
         for(let i = 200;i <= 1000;i += 400)
         {
            setTimeout(_ => zeroTheHero(response.indication, response.minWidth, response.minHeight), i);
         }
      }
   }).catch(error => {
      console.error("h2zCheck:", error);
   });
}

function zeroTheHero(indication, minWidth, minHeight)
{
   const images = document.getElementsByTagName('img');
   if(images.length === _imgCount && document.querySelector(".DestroyedByH2Z"))
   {
      console.debug(`H2Z CS skip this round`);
      return;
   }

   _imgCount = images.length;

   console.info(`H2Z CS ${_imgCount} images`);
   if(_imgCount > 0)
   {
      const screenArea = window.innerWidth * window.innerHeight;

      let heroImage = null;
      for(const img of images)
      {
         const imgStartPct = img.y / window.innerHeight;
         const imgArea = img.clientWidth * img.clientHeight;
         const windowCoverage = imgArea / screenArea;

         console.debug(`H2Z CS Image at ${img.y} (${Math.round(imgStartPct * 100)}%) is ${img.clientWidth}x${img.clientHeight} (${Math.round(windowCoverage * 100)}%) ${img.src}`);

         // Really excessive
         if(img.y > 10 && img.y < window.innerHeight * 0.25 && imgArea > 0 && screenArea > 0 && imgArea / screenArea > 0.45)
         {
            heroImage = img;
            console.debug(`H2Z CS Instant winner A!`);
            break;
         }

         // Kinda big & bad
         if(img.y > 20 && img.y < window.innerHeight * 0.50 && imgArea > 0 && screenArea > 0 && imgArea / screenArea > 0.35)
         {
            heroImage = img;
            console.debug(`H2Z CS Instant winner B!`);
            break;
         }

         // Still hefty
         if(img.y > 40 && img.y < window.innerHeight * 0.70 && imgArea > 0 && screenArea > 0 && imgArea / screenArea > 0.25)
         {
            heroImage = img;
            console.debug(`H2Z CS Instant winner C!`);
            break;
         }

         // Big enough
         if(img.y > 20 && img.y < window.innerHeight * 0.80 && img.clientWidth > minWidth && img.clientHeight > minHeight)
         {
            console.debug(`H2Z CS Candidate ${img.clientWidth}x${img.clientHeight} for ${img.src}`);

            if(!heroImage || img.clientWidth > heroImage.clientWidth || img.clientHeight > heroImage.clientHeight)
            {
               heroImage = img;
               console.debug(`H2Z CS New largest`);
            }
         }
      }

      console.info(`H2Z CS heroImage`, heroImage);
      if(heroImage instanceof HTMLImageElement)
      {
         if(indication === "none")
         {
            heroImage.remove();
            const marker = document.createElement('a');
            addClass(marker, "DestroyedByH2Z");
            marker.style = "display: none";
            body.appendChild(marker);
         }
         else
         {
            _hero = heroImage;
            _zero = document.createElement('img');
            addClass(_zero, "DestroyedByH2Z");
            _zero.src = browser.runtime.getURL('icons/placeholder.png');
            _zero.width = PLACEHOLDER_WIDTH;
            _zero.height = PLACEHOLDER_HEIGHT;
            _zero.alt = PLACEHOLDER_TEXT;
            _zero.style = "cursor: help";
            _zero.title = PLACEHOLDER_TEXT + ". " + PLACEHOLDER_TEXT_RESTORE;
            _zero.addEventListener("click", restoreHero);
            _hero.parentNode.replaceChild(_zero, _hero);
         }

         _didDestroy = true;
      }
   }
}

function restoreHero()
{
   if(_hero && _zero)
   {
      _zero.parentNode.replaceChild(_hero, _zero);
   }
}



browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
   console.debug("H2Z CS Message received", message);
   if(message.msgType === MSGTYPE_TOGGLE_SITE)
   {
      if(_didDestroy)
      {
         console.debug("H2Z CS reloading page!");
         location.reload();
      }
      else if(message.isSiteDestroying)
      {
         h2zCheck();
      }
   }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', h2zCheck);
} else {
    h2zCheck();
}
