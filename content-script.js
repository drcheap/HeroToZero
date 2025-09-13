const PLACEHOLDER_WIDTH = 16;
const PLACEHOLDER_HEIGHT = 16;
const PLACEHOLDER_TEXT = "Hero image replaced by HeroToZero";

let _didDestroy = false;

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
   if(document.querySelector("#DestroyedByH2Z"))
   {
      // Already did our thing
      return;
   }

   const images = document.getElementsByTagName('img');
   console.info(`H2Z CS ${images.length} images`);
   if(images.length > 0)
   {
      const screenArea = window.innerWidth * window.innerHeight;

      let heroImage = null;
      for(const img of images)
      {
         // TODO: Improve the logic of what constitutes the hero

         const imgStartPct = img.y / window.innerHeight;
         const imgArea = img.clientWidth * img.clientHeight;
         const windowCoverage = imgArea / screenArea;

console.debug(`H2Z CS imgStartPct=${Math.round(imgStartPct * 100)} windowCoverage=${Math.round(windowCoverage * 100)}`,);

        if(img.y > 10 && img.y < window.innerHeight * 0.25 && imgArea > 0 && screenArea > 0 && imgArea / screenArea > 0.50)
         {
            // Instant winner!
            heroImage = img;
            console.debug(`H2Z CS Instant winner A!`);
            break;
         }

         if(img.y > 10 && img.y < window.innerHeight * 0.50 && imgArea > 0 && screenArea > 0 && imgArea / screenArea > 0.25)
         {
            // Instant winner!
            heroImage = img;
            console.debug(`H2Z CS Instant winner B!`);
            break;
         }

         if(img.y > 10 && img.y < window.innerHeight * 0.70 && imgArea > 0 && screenArea > 0 && imgArea / screenArea > 0.15)
         {
            // Instant winner!
            heroImage = img;
            console.debug(`H2Z CS Instant winner C!`);
            break;
         }

console.debug(`H2Z CS Image at ${img.y}: ${img.clientWidth}x${img.clientHeight} for ${img.src}`);

         if(img.y > 10 && img.y < window.innerHeight * 0.75 && img.clientWidth > minWidth && img.clientHeight > minHeight)
         //if(img.clientWidth > minWidth && img.clientHeight > minHeight)
         {
            console.debug(`H2Z CS Candidate ${img.clientWidth}x${img.clientHeight} for ${img.src}`);

            if(!heroImage || img.clientWidth > heroImage.clientWidth || img.clientHeight > heroImage.clientHeight)
            {
               heroImage = img;
               console.debug(`H2Z CS New largest!`);
            }
         }
         else
         {
            console.debug(`H2Z CS Nope for ${img.clientWidth}x${img.clientHeight}`);
         }
      }

      console.info(`H2Z CS heroImage`,heroImage);
      if(heroImage instanceof HTMLImageElement)
      {
         if(indication === "none")
         {
            heroImage.remove();
            const marker = document.createElement('a');
            marker.id = "DestroyedByH2Z";
            marker.style = "display: none";
            body.appendChild(marker);
         }
         else
         {
            const replacement = document.createElement('img');
            replacement.id = "DestroyedByH2Z";
            replacement.src = browser.runtime.getURL('icons/placeholder.png');
            replacement.width = PLACEHOLDER_WIDTH;
            replacement.height = PLACEHOLDER_HEIGHT;
            replacement.alt = PLACEHOLDER_TEXT;
            replacement.style = "cursor: help";
            replacement.title = PLACEHOLDER_TEXT;
            heroImage.parentNode.replaceChild(replacement, heroImage);
         }

         _didDestroy = true;
      }
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
