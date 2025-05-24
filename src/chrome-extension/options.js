document.addEventListener('DOMContentLoaded', () => {
});

function saveOptions() {
  const apiKey = document.getElementById('apiKey').value.trim();
  const status = document.getElementById('status');
  
  if (!apiKey) {
    status.textContent = 'Please enter an API key.';
    status.className = 'status error';
    status.style.display = 'block';
    return;
  }

  if (!apiKey.startsWith('AIza')) {
    status.textContent = 'Invalid API key format. API keys should start with "AIza".';
    status.className = 'status error';
    status.style.display = 'block';
    return;
  }
  
  chrome.storage.local.set({
    geminiApiKey: apiKey
  }, () => {
    if (chrome.runtime.lastError) {
      status.textContent = 'Error saving options: ' + chrome.runtime.lastError.message;
      status.className = 'status error';
    } else {
      status.textContent = 'Options saved successfully!';
      status.className = 'status success';
    }
    status.style.display = 'block';
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  });
}

function restoreOptions() {
  chrome.storage.local.get({
    geminiApiKey: ''
  }, (items) => {
    if (chrome.runtime.lastError) {
      console.error('Error loading options:', chrome.runtime.lastError);
      return;
    }
    document.getElementById('apiKey').value = items.geminiApiKey;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);

document.getElementById('apiKey').addEventListener('input', (e) => {
  const apiKey = e.target.value.trim();
  const saveButton = document.getElementById('save');
  
  if (!apiKey || !apiKey.startsWith('AIza')) {
    saveButton.disabled = true;
    saveButton.style.opacity = '0.5';
  } else {
    saveButton.disabled = false;
    saveButton.style.opacity = '1';
  }
}); 