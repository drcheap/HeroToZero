"use strict";

const CURRENT_STORAGE_VERSION = 1;

const MSGTYPE_GET_SITE_CONFIG = "getSiteConfig";
const MSGTYPE_REFRESH_PERSITE = "refreshPersite";
const MSGTYPE_REFRESH_STATE = "refreshState";
const MSGTYPE_TOGGLE_SITE = "toggleSite";

const DEFAULT_DESTROYBYDEFAULT = true;
const DEFAULT_INDICATION = "placeholder";
const DEFAULT_MINWIDTH = 480;
const DEFAULT_MINHEIGHT = 320;

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
