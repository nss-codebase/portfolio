/* global ajax */
/* jshint unused:false */

(function(){
  'use strict';

  $(document).ready(init);

  function init(){
    $('#projects').on('click', '.up', move);
    $('#projects').on('click', '.dn', move);
  }

  function move(e){
    var projectId = $(this).parent().attr('data-id');
    var direction = $(this).attr('class');
    ajax(`/projects/${projectId}/move/${direction}`, 'put', null, (h)=>{
      $('#projects').empty().append(h);
    });
    e.preventDefault();
  }
})();
