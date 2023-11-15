document.addEventListener('DOMContentLoaded', (event) => {
  const currentPath = window.location.pathname;
  const sidebarLinks = document.querySelectorAll('.sidebar-link');

  sidebarLinks.forEach((link) => {
    link.classList.remove('active');  // Remove this line
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });

  document.getElementById('adminMenuCheckbox').addEventListener('change', function (e) {
    switchMenu(e.target.checked);
  });
  
  function switchMenu(isAdmin) {
    var menuContainer = document.getElementById('menuContainer');
    menuContainer.innerHTML = '';
    var links = isAdmin ? ADMIN_LINKS : SIDEBAR_LINKS;
    for (var path in links) {
      var details = links[path];
      var a = document.createElement('a');
      a.href = '/' + path;
      a.className = 'list-group-item list-group-item-action bg-dark text-white sidebar-link';
      if (a.getAttribute('href') === currentPath) { // Add this line
        a.classList.add('active');
      }
      a.innerHTML = '<i class="' + details.icon + '"></i>' + details.title;
      menuContainer.appendChild(a);
    }
  }
  
  var SIDEBAR_LINKS = JSON.parse(document.getElementById('sidebar-container').dataset.sidebarLinks);
  var ADMIN_LINKS = JSON.parse(document.getElementById('sidebar-container').dataset.adminLinks);

});
