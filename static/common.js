document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();  // Prevent default link behavior
  
      // Remove active class from all links
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  
      // Add active class to the clicked link
      link.classList.add('active');
  
      // Hide all sections
      document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
      });
  
      // Show the clicked section
      const sectionId = link.getAttribute('data-section');
      document.getElementById(sectionId).classList.add('active');
    });
  });
