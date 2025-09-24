// Fill in the list of site specific settings
async function populatePerSite()
{
   const psSpan = document.querySelector("#psSpan");
   psSpan.textContent = "(none)";

   const storage = await browser.storage.local.get(["persiteSettings"]);
   const persiteSettings = new Map(storage.persiteSettings);

   const ul = document.createElement("ul");

   for (const [site, thisSite] of persiteSettings.entries())
   {
      const li = document.createElement("li");

      const hzSpan = document.createElement("span");
      hzSpan.textContent = (thisSite.isDestroying ? "Zero Mode" : "Hero Mode")
      addClass(hzSpan, thisSite.isDestroying ? "zeroMode" : "heroMode");

      const delSpan = document.createElement("span");
      delSpan.textContent = "❌";
      delSpan.dataset.site = site;
      delSpan.addEventListener("click", removeSite);
      addClass(delSpan, "removeIcon");

      li.appendChild(hzSpan);
      li.append(" for " + site + " ");
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

// Fill in the counter value
async function populateCounter()
{
   const storage = await browser.storage.local.get(["zerodCount"]);
   document.querySelector("#zerodCount").textContent = storage.zerodCount;
}

// Zero out the counter value
async function resetCounter()
{
   if(confirm("Reset counter to zero?"))
   {
      browser.storage.local.set({"zerodCount": 0}).then(populateCounter);
   }
}

// Retrieve all the persisted settings
async function loadOptions()
{
   console.debug("H2Z O Loading options ...");

   const storage = await browser.storage.local.get(["destroyByDefault","indication","minWidth","minHeight"]);

   document.querySelector("input[name=destroyByDefault][value=" + storage.destroyByDefault + "]").checked = true;
   document.querySelector("input[name=indication][value=" + storage.indication + "]").checked = true;
   document.querySelector("#minWidth").value = storage.minWidth;
   document.querySelector("#minHeight").value = storage.minHeight;
   populatePerSite();
   populateCounter();
}

// Apply a change of setting: destroyByDefault
async function setDestroyByDefault()
{
   const destroyByDefault = document.querySelector("input[name=destroyByDefault]:checked").value;
   console.info("H2Z O Changing destroyByDefault to: " + destroyByDefault);
   browser.storage.local.set({"destroyByDefault": destroyByDefault});
   browser.runtime.sendMessage({msgType: MSGTYPE_REFRESH_STATE});
}

// Apply a change of setting: indication
async function setIndication()
{
   const indication = document.querySelector("input[name=indication]:checked").value;
   console.info("H2Z O Changing indication to: " + indication);
   browser.storage.local.set({"indication": indication});
   browser.runtime.sendMessage({msgType: MSGTYPE_REFRESH_STATE});
}

// Apply a change of setting: minWidth
async function setMinWidth()
{
   let minWidth = parseInt(document.querySelector("#minWidth").value);
   if(!Number.isInteger(minWidth))
   {
      console.warn("H2Z O Ignoring invalid minWidth: ",minWidth);
      minWidth = DEFAULT_MINWIDTH;
   }

   console.info("H2Z O Changing minWidth to: " + minWidth);
   document.querySelector("#minWidth").value = minWidth;
   browser.storage.local.set({"minWidth": minWidth});
   browser.runtime.sendMessage({msgType: MSGTYPE_REFRESH_STATE});
}

// Apply a change of setting: minHeight
async function setMinHeight()
{
   let minHeight = parseInt(document.querySelector("#minHeight").value);
   if(!Number.isInteger(minHeight))
   {
      console.warn("H2Z O Ignoring invalid minHeight: ",minHeight);
      minHeight = DEFAULT_MINHEIGHT;
   }

   console.info("H2Z O Changing minHeight to: " + minHeight);
   document.querySelector("#minHeight").value = minHeight;
   browser.storage.local.set({"minHeight": minHeight});
   browser.runtime.sendMessage({msgType: MSGTYPE_REFRESH_STATE});
}

// Get rid of a site specific override so that instead follows the default behavior
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


// Messaging / event handling

document.addEventListener("DOMContentLoaded", loadOptions);
document.querySelectorAll("input[name=destroyByDefault]").forEach(i => { i.addEventListener("change", setDestroyByDefault) });
document.querySelectorAll("input[name=indication]").forEach(i => { i.addEventListener("change", setIndication) });
document.querySelector("#minWidth").addEventListener("change", setMinWidth);
document.querySelector("#minHeight").addEventListener("change", setMinHeight);
document.querySelector("#zerodCount").addEventListener("click", resetCounter);
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
   console.debug("H2Z O Message received", message);
   if(message.msgType === MSGTYPE_REFRESH_PERSITE)
   {
      populatePerSite();
   }
   else if(message.msgType === MSGTYPE_REFRESH_COUNTER)
   {
      populateCounter();
   }
});
