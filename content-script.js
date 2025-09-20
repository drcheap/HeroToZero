const PLACEHOLDER_SRC = browser.runtime.getURL('icons/placeholder.png');
const PLACEHOLDER_WIDTH = 16;
const PLACEHOLDER_HEIGHT = 16;
const PLACEHOLDER_TEXT = "Hero image replaced by HeroToZero";
const PLACEHOLDER_TEXT_RESTORE = "Click to restore orignal.";

let _didDestroy = false;
let _imgCount = 0;
let _hero = null;
let _zero = null;

// Main checking entry point
function h2zCheck()
{
   console.debug("H2Z CS checking site ...");

   // We need to know how to behave, so query the background script for the current configuration
   browser.runtime.sendMessage({ msgType: MSGTYPE_GET_SITE_CONFIG, url: window.location.href }).then(response => {
      console.debug("H2Z CS Received messaging response:", response);
      if(response.ready && response.isSiteDestroying)
      {
         // We will try a few times, because some sites load content lazily
         setTimeout(_ => zeroTheHero(response.indication, response.minWidth, response.minHeight), 50);
         setTimeout(_ => zeroTheHero(response.indication, response.minWidth, response.minHeight), 350);
         setTimeout(_ => zeroTheHero(response.indication, response.minWidth, response.minHeight), 900);
         setTimeout(_ => zeroTheHero(response.indication, response.minWidth, response.minHeight), 1500);
      }
   }).catch(error => {
      console.error("h2zCheck:", error);
   });
}

// The meat of this operation, that hunts and destroys when applicable
function zeroTheHero(indication, minWidth, minHeight)
{
   const images = document.getElementsByTagName('img');
   if(images.length === _imgCount && _didDestroy)
   {
      console.debug(`H2Z CS skip this round`);
      return;
   }

   _imgCount = images.length;

   console.debug(`H2Z CS ${_imgCount} images`);
   if(_imgCount > 0)
   {
      const screenArea = window.innerWidth * window.innerHeight;
      let heroElement = null;
      for(const img of images)
      {
         const imgStartPct = img.y / window.innerHeight;
         const imgArea = img.clientWidth * img.clientHeight;
         const windowCoverage = imgArea / screenArea;

         console.debug(`H2Z CS Image at ${img.y} (${Math.round(imgStartPct * 100)}%) is ${img.clientWidth}x${img.clientHeight} (${Math.round(windowCoverage * 100)}%) ${img.src}`);

         // Really excessive
         if(img.y > 10 && img.y < window.innerHeight * 0.25 && imgArea > 0 && screenArea > 0 && imgArea / screenArea > 0.45)
         {
            heroElement = img;
            console.debug(`H2Z CS Instant winner A!`);
            break;
         }

         // Kinda big & bad
         if(img.y > 20 && img.y < window.innerHeight * 0.50 && imgArea > 0 && screenArea > 0 && imgArea / screenArea > 0.35)
         {
            heroElement = img;
            console.debug(`H2Z CS Instant winner B!`);
            break;
         }

         // Still hefty
         if(img.y > 40 && img.y < window.innerHeight * 0.70 && imgArea > 0 && screenArea > 0 && imgArea / screenArea > 0.25)
         {
            heroElement = img;
            console.debug(`H2Z CS Instant winner C!`);
            break;
         }

         // Big enough
         if(img.y > 20 && img.y < window.innerHeight * 0.80 && img.clientWidth > minWidth && img.clientHeight > minHeight)
         {
            console.debug(`H2Z CS Candidate ${img.clientWidth}x${img.clientHeight} for ${img.src}`);

            if(!heroElement || img.clientWidth > heroElement.clientWidth || img.clientHeight > heroElement.clientHeight)
            {
               heroElement = img;
               console.debug(`H2Z CS New largest`);
            }
         }
      }

      if(heroElement instanceof HTMLImageElement || parentElement instanceof HTMLPictureElement || parentElement.tagName === 'FIGURE')
      {
         // We got one!  Now for a bit of refinement
         heroElement = considerAncestors(heroElement);

         console.info(`H2Z CS heroElement`, heroElement);

         // Target acquired, time take it out
         if(indication === "none")
         {
            heroElement.remove();
         }
         else
         {
            _hero = heroElement;
            _zero = document.createElement('img');
            _zero.src = PLACEHOLDER_SRC;
            _zero.width = PLACEHOLDER_WIDTH;
            _zero.height = PLACEHOLDER_HEIGHT;
            _zero.style = "cursor: help";
            _zero.style = `width: ${PLACEHOLDER_WIDTH}`;
            _zero.style = `height: ${PLACEHOLDER_HEIGHT}`;
            _zero.alt = PLACEHOLDER_TEXT;
            _zero.title = PLACEHOLDER_TEXT + ". " + PLACEHOLDER_TEXT_RESTORE;
            _zero.addEventListener("click", restoreHero);
            _hero.parentNode.replaceChild(_zero, _hero);
         }

         _didDestroy = true;
      }
   }
}

// Recursively walk up the DOM looking for pure containers
function considerAncestors(element)
{
   let parentElement = element.parentElement;
   if(parentElement && (element.src === PLACEHOLDER_SRC || parentElement instanceof HTMLPictureElement || parentElement.tagName === 'FIGURE' || parentElement.children.length === 1))
   {
      console.debug(`H2Z CS going up to`, parentElement);

      // Lots of things could be preventing a size reduction, so check for...
      //    A previously zerod hero
      //    A <picture> that contains our hero
      //    A <figure> that contains our hero
      //    Any other element that contains our hero and nothing else
      // Any of these is grounds for expanding our scope
      return considerAncestors(parentElement); // This is our new candidate, but keep checking higher
   }

   return element;  // Nope, stick with this one
}

// Put back whatever was altered
function restoreHero(e)
{
   e.preventDefault();

   if(_hero && _zero)
   {
      _zero.parentNode.replaceChild(_hero, _zero);
   }
}


// Messaging / event handling

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
   console.debug("H2Z CS Message received", message);
   if(message.msgType === MSGTYPE_TOGGLE_SITE)
   {
      // Actions outside this tab occurred that may affect us so we need to re-evaluate the situation
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

// A couple of different ways to be triggered, depending on the timing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', h2zCheck);
} else {
    h2zCheck();
}
