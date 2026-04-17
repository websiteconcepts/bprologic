// Load shared header and footer partials
(function() {
	function loadPartial(url, placeholderId, callback) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4 && xhr.status === 200) {
				var el = document.getElementById(placeholderId);
				if (el) {
					el.innerHTML = xhr.responseText;
				}
				if (callback) callback();
			}
		};
		xhr.send();
	}

	// Load header first, then footer, then re-initialize the menu system
	loadPartial('partials/header.html', 'header-placeholder', function() {
		loadPartial('partials/footer.html', 'footer-placeholder', function() {
			// Re-initialize the Phantom template's menu toggle after injecting the header
			var menu = document.getElementById('menu');
			var menuLink = document.querySelector('a[href="#menu"]');
			if (menu && menuLink) {
				var body = document.body;
				var wrapper = document.getElementById('wrapper');

				menuLink.addEventListener('click', function(e) {
					e.preventDefault();
					body.classList.add('is-menu-visible');
				});

				// Close menu on click outside or on close
				menu.addEventListener('click', function(e) {
					if (e.target === menu) {
						body.classList.remove('is-menu-visible');
					}
				});

				// Close on escape
				document.addEventListener('keydown', function(e) {
					if (e.key === 'Escape') {
						body.classList.remove('is-menu-visible');
					}
				});

				// Add close button behavior
				var closeButton = menu.querySelector('.close');
				if (closeButton) {
					closeButton.addEventListener('click', function(e) {
						e.preventDefault();
						body.classList.remove('is-menu-visible');
					});
				}
			}
		});
	});
})();
