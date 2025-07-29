async function loadResults() {
  const res = await fetch('results.json');
  const data = await res.json();
  const list = document.getElementById('resultsList');

  const fields = {
    keywords: document.getElementById('keywords'),
    period: document.getElementById('period'),
    type: document.getElementById('type'),
    ledger: document.getElementById('ledger'),
    location: document.getElementById('location'),
    owner: document.getElementById('owner')
  };

  function render(entries) {
    list.innerHTML = '';
    if (entries.length === 0) {
      list.innerHTML = '<p>No results found.</p>';
      return;
    }

    entries.forEach(item => {
      const previewImage = (item.gallery && item.gallery.length > 0) ? item.gallery[0] : '';

      const el = document.createElement('a');
      el.href = `entry.html?id=${item.id}`;
      el.className = 'result-item';
      el.innerHTML = `
        ${previewImage ? `<img src="${previewImage}" alt="${item.title}">` : ''}
        <div class="result-details">
          <h3>${item.title}</h3>
          <p><strong>Location:</strong> ${item.location || 'N/A'}</p>
          <p><strong>Date:</strong> ${item.date || 'N/A'}</p>
          <p><strong>Period:</strong> ${item.period || 'N/A'}</p>
          <p><strong>Type:</strong> ${item.type || 'N/A'}</p>
          <p><strong>Description:</strong> ${item.description || ''}</p>
        </div>
      `;
      list.appendChild(el);
    });
  }

  function applyFilters() {
    const filtered = data.filter(item => {
      return (!fields.keywords.value || item.title.toLowerCase().includes(fields.keywords.value.toLowerCase()) || (item.description && item.description.toLowerCase().includes(fields.keywords.value.toLowerCase()))) &&
             (!fields.period.value || item.period === fields.period.value) &&
             (!fields.type.value || item.type === fields.type.value) &&
             (!fields.ledger.value || (item.ledger && item.ledger.toLowerCase() === fields.ledger.value.toLowerCase())) &&
             (!fields.location.value || (item.location && item.location.toLowerCase().includes(fields.location.value.toLowerCase()))) &&
             (!fields.owner.value || (item.owner && item.owner.toLowerCase() === fields.owner.value.toLowerCase()));
    });
    render(filtered);
  }

  Object.values(fields).forEach(field => field.addEventListener('input', applyFilters));
  document.getElementById('resetBtn').addEventListener('click', () => {
    Object.values(fields).forEach(f => f.value = '');
    render(data);
  });

  render(data);
}

loadResults();

