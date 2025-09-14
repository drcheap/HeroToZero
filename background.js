// Global state vars, set defaults here
var _ready = false;
var _destroyByDefault = DEFAULT_DESTROYBYDEFAULT;
var _indication = DEFAULT_INDICATION;
var _minWidth = DEFAULT_MINWIDTH;
var _minHeight = DEFAULT_MINHEIGHT;
var _persiteSettings = new Map();


async function initialize(details)
{
   console.debug("Initializing...");

   // Preset initialization
   const storage = await browser.storage.local.get(["version","destroyByDefault","indication","minWidth","minHeight","persiteSettings"]);
   if(Number.isInteger(storage.version))
   {
      if(storage.version < CURRENT_STORAGE_VERSION)
      {
         // Storage is old, do any necessary upgrades to remain compatible

         if(storage.version == 1)
         {
            // (future storage updates here)
         }

         await browser.storage.local.set({"version": storage.version});
      }
   }
   else
   {
      console.info("No storage version tag found, initializing...");
      storage.version = CURRENT_STORAGE_VERSION;
      await browser.storage.local.set({"version": storage.version});
   }

   if(storage.destroyByDefault === undefined)
   {
      console.info("No destroyByDefault setting found, initializing...");
      storage.destroyByDefault = _destroyByDefault;
      await browser.storage.local.set({"destroyByDefault": storage.destroyByDefault});
   }

   if(storage.indication === undefined)
   {
      console.info("No indication setting found, initializing...");
      storage.indication = _indication;
      await browser.storage.local.set({"indication": storage.indication});
   }

   if(storage.minWidth === undefined)
   {
      console.info("No minWidth setting found, initializing...");
      storage.minWidth = _minWidth;
      await browser.storage.local.set({"minWidth": storage.minWidth});
   }

   if(storage.minHeight === undefined)
   {
      console.info("No minHeight setting found, initializing...");
      storage.minHeight = _minHeight;
      await browser.storage.local.set({"minHeight": storage.minHeight});
   }

   if(storage.persiteSettings === undefined)
   {
      console.info("No persiteSettings setting found, initializing...");
      storage.persiteSettings = _persiteSettings;
      await browser.storage.local.set({"persiteSettings": [...storage.persiteSettings]});
   }
   else
   {
      storage.persiteSettings = new Map(storage.persiteSettings);
   }

   loadSettings();

   console.debug("Initialization complete...");
   console.debug("   Storage version: " + storage.version);
   console.debug("   destroyByDefault: " + storage.destroyByDefault);
   console.debug("   indication: " + storage.indication);
   console.debug("   min w/h: " + storage.minWidth + '/' + storage.minHeight);
   console.debug("   Per-site setting count: " + storage.persiteSettings.size);
}

async function loadSettings()
{
   const storage = await browser.storage.local.get(["version","destroyByDefault","indication","minWidth","minHeight","persiteSettings"]);
   if(storage === undefined || storage.version === undefined || storage.version !== CURRENT_STORAGE_VERSION)
   {
      console.warn("Not loading settings because not fully initialized yet");
      return; // Nothing to load yet
   }

   console.debug("Loading stored settings...");

   const destroyByDefault = storage.destroyByDefault;
   if(destroyByDefault !== undefined)
   {
      _destroyByDefault = storage.destroyByDefault || storage.destroyByDefault === "true" ;  // Could be boolean or string in storage, need as boolean
   }

   const indication = storage.indication;
   if(indication !== undefined)
   {
      _indication = indication;
   }

   const minWidth = storage.minWidth;
   if(minWidth !== undefined)
   {
      _minWidth = minWidth;
   }

   const minHeight = storage.minHeight;
   if(minHeight !== undefined)
   {
      _minHeight = minHeight;
   }

   const persiteSettings = storage.persiteSettings;
   if(persiteSettings !== undefined)
   {
      _persiteSettings = new Map(persiteSettings);
   }

   setAllToolbarIcons();
   _ready = true;
}

function isSiteDestroying(site)
{
//   console.debug("isSiteDestroying(site)",site);
   let result = _destroyByDefault;

   if(site !== undefined && site.length > 0)
   {
      const thisSite = _persiteSettings.get(site);
//console.debug("_destroyByDefault",_destroyByDefault);
//console.debug("thisSite",thisSite);
      result = thisSite ? thisSite.isDestroying : _destroyByDefault;
   }

   return result;
}

async function setSiteDestroying(site, destroying)
{
   if(site !== undefined && site.length > 0)
   {
      const thisSite = _persiteSettings.has(site) ? _persiteSettings.get(site) : {};
      console.debug("Changing site setting: " + thisSite.isDestroying + " -> " + destroying);
      thisSite.isDestroying = destroying;
      _persiteSettings.set(site, thisSite);
      await browser.storage.local.set({"persiteSettings": [..._persiteSettings]});
   }
}

function getHostnameFromURL(url)
{
   try {
      return new URL(url).hostname;
   } catch {
      return "";
   }
}

function setAllToolbarIcons()
{
   browser.tabs.query({}).then(allTabs => allTabs.forEach(tab => setIconByURL(tab.url, tab.id)));
}

function setIconByURL(url, tabId)
{
   const site = getHostnameFromURL(url);
   updateToolbarIcon(isSiteDestroying(site), tabId);
}

function updateToolbarIcon(thisSiteDestroying = false, tabId)
{
   let hORz = "h";
   let title = "HeroToZero is in Hero Mode (Allowing hero images)";
   if(thisSiteDestroying)
   {
      hORz = "z";
      title = "HeroToZero is in Zero Mode (Destroying hero images)";
   }

   // Must do this kludge because browserAction.setIcon does not yet support the theme_icons structured object
   // See also: https://bugzilla.mozilla.org/show_bug.cgi?id=1416871
   const lightORdark = window.matchMedia("(prefers-color-scheme: dark)").matches ? "light" : "dark";
   const iconParams = {
      "path": {
         "16": "icons/logo-" + hORz + "-16-" + lightORdark + ".png",
         "32": "icons/logo-" + hORz + "-32-" + lightORdark + ".png",
      }
   };

   const titleParams = {
      "title": title
   };

   if(tabId !== undefined && tabId >= 0)
   {
      iconParams.tabId = tabId;
      titleParams.tabId = tabId;
   }

   browser.browserAction.setIcon(iconParams);
   browser.browserAction.setTitle(titleParams);

//   console.debug("Set icon" + (tabId ? "" : " for tab " + tabId) + ": " + title);
}


function navigationHandler(tabId, changeInfo, tab)
{
   console.debug("Navigation on tab " + tabId);
   setIconByURL(changeInfo.url, tabId);
}

async function toggleSite(tab)
{
   const site = getHostnameFromURL(tab.url);
   console.info("Toggle from tab " + tab.id + (site ? " at " + site : ""));
   if(site.length > 0)
   {
      // Save new setting
      const thisSiteDestroying = !isSiteDestroying(site);
      await setSiteDestroying(site, thisSiteDestroying);

      // Update this tab (and let it know about that)
      updateToolbarIcon(thisSiteDestroying, tab.id);
      browser.tabs.sendMessage(tab.id, {msgType: MSGTYPE_TOGGLE_SITE, isSiteDestroying: thisSiteDestroying});

      // Also update icon for any other visible tabs at this same site
      browser.tabs.query({"active": true, "currentWindow": false}).then(allTabs => allTabs.forEach(otherTab => {
         if(otherTab.id !== tab.id && getHostnameFromURL(otherTab.url) === site)
         {
            updateToolbarIcon(thisSiteDestroying, otherTab.id);
         }
      }));

      // In case the options page is open, let it know to refresh the site list
      browser.runtime.sendMessage({msgType: MSGTYPE_REFRESH_PERSITE}).catch(err => {
         if(err.message !== "Could not establish connection. Receiving end does not exist.") {
            console.error("Messaging error:", err);
         }
      });
   }
}

function getSiteConfig(site)
{
   const result = {};
   result.ready = _ready;
   result.isSiteDestroying = isSiteDestroying(site);
   result.indication = _indication;
   result.minWidth = _minWidth;
   result.minHeight = _minHeight;
   return result;
}


browser.runtime.onInstalled.addListener(initialize);
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
   console.debug("Message received", message);
   if(message.msgType === MSGTYPE_REFRESH_STATE)
   {
      loadSettings();
   }
   else if(message.msgType === MSGTYPE_GET_SITE_CONFIG)
   {

      return Promise.resolve(getSiteConfig(getHostnameFromURL(message.url)));
   }
});
browser.browserAction.onClicked.addListener(toggleSite);
browser.tabs.onUpdated.addListener(navigationHandler, {properties: ["url"]});

window.matchMedia("(prefers-color-scheme: dark)").addListener(() => {
  setAllToolbarIcons(); // Upodate icons when the theme changes
});

const manifest = browser.runtime.getManifest();
console.info(manifest.name + " version " + manifest.version + " by " + manifest.author);
loadSettings();
