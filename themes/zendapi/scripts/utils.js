"use strict";
let PathUtils = require("path");
let Clone = require("clone");
let _ = require('lodash');

const { spawnSync } = require('child_process');

hexo.extend.helper.register('manual_key_from_path', function(path){
   return PathUtils.basename(path, ".html");
});

hexo.extend.helper.register('clone', function(source){
   return Clone(source);
});

hexo.extend.helper.register('get_manual_catalog', function(page, config, site){
   let url_for = hexo.extend.helper.get('url_for');
   let clone = hexo.extend.helper.get('clone');
   let manual_key_from_path = hexo.extend.helper.get('manual_key_from_path');
   let targetVersion;
   if ("mainEntry" == page.subtype || "versionEntry" == page.subtype) {
      targetVersion = config.zapi_version;
   } else {
      let pagePath = page.canonical_path;
      let match = pagePath.match(/manual\/([.\d]*)/);
      targetVersion = match[1];
   }
   let versionKey = "manual/v"+targetVersion.replace(/\./g, "");
   let catalog = clone(site.data[versionKey]);
   let key = manual_key_from_path(page.path);
   let baseUrl = "manual/"+targetVersion;

   catalog.forEach(function(category){
      if (category.children && category.children.length != 0) {
         category.children.forEach(function(item){
            if (item.key == key) {
               item.isActive = true;
               category.isOpen = true;
               item.url = url_for.call(hexo, page.canonical_path);
            }
            item.url = url_for.call(hexo,baseUrl + "/"+ category.key + "/" + item.key + ".html");
         });
      }
   });
   if ("mainEntry" == page.subtype || "versionEntry" == page.subtype) {
      catalog.forEach(function(category){
         if (category.key == "prologue") {
            category.isOpen = true;
         }
      });
   }
   return catalog;
});

/**
 * 我在这里提供这个helper是为版本号做准备的, 暂时我们在积极的开发，不提供版本号的api手册
 * 只提供实时的api手册文档
 */
hexo.extend.helper.register('get_api_catalog', function(page, config, site){

   let url_for = hexo.extend.helper.get('url_for');
   let items = site.data['api/catalog'];
   return items.map(function(item) {
      return {
         name: item.name,
         url: url_for.call(hexo, item.url),
         key: item.key,
         isActive: item.key == page.layout
      };
   });
});

hexo.extend.helper.register('get_doxygen_version', function(){
   let ret = spawnSync("doxygen", ["--version"]);
   if (0 != ret.status) {
      throw ret.stderr.toString(); 
   } else {
      return _.trim(ret.stdout.toString());
   }
});


hexo.extend.helper.register('sort_api_entity_by_name',function(left, right){
   if (left.name < right.name) {
      return -1;
   } else if (left.name == right.name) {
      return 0;
   } else {
      return 1;
   }
});
