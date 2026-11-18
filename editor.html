<!DOCTYPE html>
<html><body>
<div>当前用户：<span id="who"></span> <a href="/index.html">看文章</a></div>
<div id="editor" contenteditable="true"
     style="min-height:200px;border:1px solid #ccc;padding:10px;margin:10px 0;">
  在这里打字（直接用拼音输入法）...
</div>
<input type="file" id="file" accept="image/*" style="display:none">
<button onclick="file.click()">插入图片</button>
<button onclick="publish()">发布</button>
<script>
const token = localStorage.getItem('token');
if (!token) location.href = '/login.html';
who.textContent = localStorage.getItem('username');

// 选图后上传，并把 <img> 插到光标处
file.onchange = async () => {
  const fd = new FormData();
  fd.append('image', file.files[0]);
  const r = await fetch('/api/upload', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: fd
  });
  const data = await r.json();
  if (!data.url) return alert('上传失败');
  const img = document.createElement('img');
  img.src = data.url;
  img.style.maxWidth = '300px';
  editor.appendChild(img); // 简单追加到末尾
  file.value = '';
};

async function publish() {
  const r = await fetch('/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify({ content: editor.innerHTML })
  });
  const data = await r.json();
  alert(data.msg);
  if (r.ok) { editor.innerHTML = ''; }
}
</script>
</body></html>