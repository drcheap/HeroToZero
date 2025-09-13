/* These constants should match those in background.js */
const MODE_GLOBAL = "global";
const MODE_PERSITE = "persite";

var operatingMode = MODE_PERSITE;

// hasClass, addClass, removeClass functions borrowed (and reformatted) from: https://stackoverflow.com/questions/6787383
function hasClass(ele,cls)
{
   return !!ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
}

function addClass(ele,cls)
{
   if(!hasClass(ele,cls))
   {
      ele.className += " " + cls;
   }
}

function removeClass(ele,cls)
{
   if (hasClass(ele,cls))
   {
      const reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
      ele.className = ele.className.replace(reg,' ');
   }
}

async function populatePerSite()
{
   const psSpan = document.querySelector("#psSpan");
   psSpan.textContent = "(none)";

   const storage = await browser.storage.local.get(["persiteSettings"]);
   const persiteSettings = new Map(storage.persiteSettings);

   const ul = document.createElement("ul");

   for (const [site, thisSite] of persiteSettings.entries())
   {
      console.debug("Found item " + site + ": " + thisSite.isDestroying);
      const li = document.createElement("li");

      const hzSpan = document.createElement("span");
      hzSpan.textContent = (thisSite.isDestroying ? "Zero" : "Hero")
      addClass(hzSpan, thisSite.isDestroying ? "zeroMode" : "heroMode");

      const delSpan = document.createElement("span");
      delSpan.textContent = "❌";
      delSpan.dataset.site = site;
      delSpan.addEventListener("click", removeSite);
      addClass(delSpan, "removeIcon");

      li.appendChild(hzSpan);
      li.append(" " + site + " ");
      li.appendChild(delSpan);

      ul.appendChild(li);
   }

   if(ul.childElementCount > 0)
   {
      while(psSpan.firstChild)
      {
         psSpan.removeChild(psSpan.firstChild);
      }

      psSpan.appendChild(ul);
   }
}

function doOnLoad()
{
   loadOptions();
}

async function loadOptions()
{
   console.debug("Loading options ...");

   const storage = await browser.storage.local.get(["destroyByDefault","indication","minWidth","minHeight","persiteSettings"]);

   document.querySelector("input[name=destroyByDefault][value=" + storage.destroyByDefault + "]").checked = true;
   document.querySelector("input[name=indication][value=" + storage.indication + "]").checked = true;
   document.querySelector("#minWidth").value = storage.minWidth;
   document.querySelector("#minHeight").value = storage.minHeight;
   populatePerSite();
}

async function setDestroyByDefault()
{
   const destroyByDefault = document.querySelector("input[name=destroyByDefault]:checked").value;
   console.info("Changing destroyByDefault to: " + destroyByDefault);
   browser.storage.local.set({"destroyByDefault": destroyByDefault});
   browser.runtime.sendMessage({msgType: MSGTYPE_REFRESH_STATE});
}

async function setIndication()
{
   const indication = document.querySelector("input[name=indication]:checked").value;
   console.info("Changing indication to: " + indication);
   browser.storage.local.set({"indication": indication});
   browser.runtime.sendMessage({msgType: MSGTYPE_REFRESH_STATE});
}

async function setMinWidth()
{
   let minWidth = parseInt(document.querySelector("#minWidth").value);
   if(!Number.isInteger(minWidth))
   {
      console.warn("Ignoring invalid minWidth: ",minWidth);
      minWidth = DEFAULT_MINWIDTH;
   }

   console.info("Changing minWidth to: " + minWidth);
   document.querySelector("#minWidth").value = minWidth;
   browser.storage.local.set({"minWidth": minWidth});
   browser.runtime.sendMessage({msgType: MSGTYPE_REFRESH_STATE});
}

async function setMinHeight()
{
   let minHeight = parseInt(document.querySelector("#minHeight").value);
   if(!Number.isInteger(minHeight))
   {
      console.warn("Ignoring invalid minHeight: ",minHeight);
      minHeight = DEFAULT_MINHEIGHT;
   }

   console.info("Changing minHeight to: " + minHeight);
   document.querySelector("#minHeight").value = minHeight;
   browser.storage.local.set({"minHeight": minHeight});
   browser.runtime.sendMessage({msgType: MSGTYPE_REFRESH_STATE});
}

async function removeSite(e)
{
   e.preventDefault();

   const storage = await browser.storage.local.get(["persiteSettings"]);
   const persiteSettings = new Map(storage.persiteSettings);
   persiteSettings.delete(e.target.dataset.site);
   await browser.storage.local.set({"persiteSettings": [...persiteSettings]});
   populatePerSite();
   browser.runtime.sendMessage({msgType: MSGTYPE_REFRESH_STATE});
}

document.addEventListener("DOMContentLoaded", doOnLoad);
document.querySelectorAll("input[name=destroyByDefault]").forEach(i => { i.addEventListener("change", setDestroyByDefault) });
document.querySelectorAll("input[name=indication]").forEach(i => { i.addEventListener("change", setIndication) });
document.querySelector("#minWidth").addEventListener("change", setMinWidth);
document.querySelector("#minHeight").addEventListener("change", setMinHeight);
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
   console.debug("Message received", message);
   if(message.msgType === MSGTYPE_REFRESH_PERSITE)
   {
      populatePerSite();
   }
});
