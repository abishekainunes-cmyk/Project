/* Automated File Upload, Multi-File Processing & Catalogue Studio Client */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  
  window.addEventListener('DOMContentLoaded', () => {
    const dropzone = $('dropzone');
    const fileInput = $('auto-upload-input');
    const progress = $('auto-upload-progress');
    const statusText = $('auto-upload-status-text');
    const resultBox = $('auto-upload-result');
    const batchContainer = $('batch-results-container');
    const batchTable = $('batch-file-table');
    const btnDownloadAllZip = $('btn-download-all-zip');

    if (!dropzone || !fileInput) return;

    // Drag & Drop events
    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, e => {
        e.preventDefault();
        dropzone.style.borderColor = '#2563eb';
        dropzone.style.background = '#eff6ff';
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, e => {
        e.preventDefault();
        dropzone.style.borderColor = '#93c5fd';
        dropzone.style.background = '#fff';
      });
    });

    dropzone.addEventListener('drop', e => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        if (files.length === 1) {
          handleUpload(files[0]);
        } else {
          handleBatchUpload(Array.from(files));
        }
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        if (fileInput.files.length === 1) {
          handleUpload(fileInput.files[0]);
        } else {
          handleBatchUpload(Array.from(fileInput.files));
        }
      }
    });

    let currentResult = null;
    let batchResults = [];

    async function handleUpload(file) {
      if (!file) return;

      progress.style.display = 'block';
      progress.className = 'notice';
      statusText.textContent = `Analyzing "${file.name}" and extracting specifications…`;
      resultBox.style.display = 'none';
      if (batchContainer) batchContainer.style.display = 'none';

      const formData = new FormData();
      formData.append('file', file);
      formData.append('save_drive', '1');

      try {
        statusText.textContent = 'Parsing document contents and formulating certified catalogue…';
        const upHeaders = {};
        const adminKey = localStorage.getItem('nunes_admin_key');
        if (adminKey) upHeaders['X-Nunes-Key'] = adminKey;

        const res = await fetch('/api/catalogue/upload-auto-generate', {
          method: 'POST',
          headers: upHeaders,
          body: formData
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to detect details or generate catalogue');
        }

        currentResult = data;
        statusText.textContent = 'Generating 2-page Full Catalogue (VTech VT) and Mini Catalogue…';
        
        // Populate results card
        if ($('detected-prod-name')) {
          $('detected-prod-name').textContent = data.product_name || 'Industrial Instrument';
        }
        
        const srcModel = data.source_model || data.model || 'VT';
        const catModel = data.catalogue_model || 'VT';
        if ($('detected-model')) {
          $('detected-model').innerHTML = `${catModel} <span style="font-weight:normal;color:#64748b;font-size:12px;">(Source Model: <strong>${srcModel}</strong>)</span>`;
        }

        if ($('detected-specs')) {
          $('detected-specs').textContent = data.specifications || 'No technical specifications parsed.';
        }
        
        if ($('detected-photo')) {
          if (data.photo_data_b64) {
            $('detected-photo').src = data.photo_data_b64;
            $('detected-photo').style.display = 'inline-block';
          } else {
            $('detected-photo').style.display = 'none';
          }
        }

        // Show File metadata, Confidence score & review warnings
        let metaNotice = $('detected-meta-notice');
        if (!metaNotice) {
          metaNotice = document.createElement('div');
          metaNotice.id = 'detected-meta-notice';
          metaNotice.style.margin = '8px 0 12px 0';
          metaNotice.style.fontSize = '12px';
          const headerWrap = resultBox.firstElementChild;
          if (headerWrap) {
            headerWrap.parentNode.insertBefore(metaNotice, headerWrap.nextSibling);
          }
        }

        const warnings = (data.warnings || []).concat(data.missing_info || []);
        const warningHtml = warnings.length > 0 
          ? `<div style="background:#fffbeb;border:1px solid #fef3c7;color:#92400e;padding:7px 12px;border-radius:6px;margin-top:6px;">⚠️ <strong>Review Note:</strong> ${warnings.join(' · ')}</div>`
          : '';

        const conf = data.confidence || {};
        const confScore = conf.score || 95;
        const confLevel = conf.level || 'High Confidence';
        const draftSource = conf.draft_source || 'Verified Source Facts';

        metaNotice.innerHTML = `
          <div style="display:flex;gap:10px;flex-wrap:wrap;color:#475569;font-size:11.5px;align-items:center;">
            <span>📁 <strong>File:</strong> ${file.name}</span>
            <span>📑 <strong>Format:</strong> <span style="background:#e0f2fe;color:#0369a1;padding:2px 7px;border-radius:4px;font-weight:700;">${data.detected_format || 'Document'}</span></span>
            <span>🎯 <strong>Confidence:</strong> <span style="background:#dcfce7;color:#166534;padding:2px 7px;border-radius:4px;font-weight:700;">${confLevel} (${confScore}%)</span></span>
            <span>🤖 <strong>Draft:</strong> <span style="background:#f3e8ff;color:#7e22ce;padding:2px 7px;border-radius:4px;font-weight:700;">${draftSource}</span></span>
            <span>✅ <strong>Specs:</strong> <span style="color:#059669;font-weight:700;">${data.spec_count || 5} rows</span></span>
          </div>
          ${warningHtml}
        `;

        // Candidate Images Gallery
        if (data.candidate_images && data.candidate_images.length > 1) {
          const gallery = document.createElement('div');
          gallery.style.marginTop = '10px';
          gallery.innerHTML = '<div style="font-size:11px;font-weight:bold;color:#475569;margin-bottom:6px;">📷 Extracted Candidate Images (Click to select for catalogue):</div>';
          const imgRow = document.createElement('div');
          imgRow.style.display = 'flex';
          imgRow.style.gap = '8px';
          imgRow.style.flexWrap = 'wrap';
          data.candidate_images.forEach((imgB64, idx) => {
            const thumb = document.createElement('img');
            thumb.src = imgB64;
            thumb.style.width = '55px';
            thumb.style.height = '55px';
            thumb.style.objectFit = 'contain';
            thumb.style.border = idx === 0 ? '2px solid #2563eb' : '2px solid #cbd5e1';
            thumb.style.borderRadius = '6px';
            thumb.style.cursor = 'pointer';
            thumb.style.background = '#fff';
            thumb.title = `Candidate #${idx + 1}`;
            thumb.onclick = () => {
              if ($('detected-photo')) {
                $('detected-photo').src = imgB64;
                $('detected-photo').style.display = 'inline-block';
              }
              data.photo_data_b64 = imgB64;
              if ($('imageview')) {
                $('imageview').src = imgB64;
                $('imageview').hidden = false;
              }
              imgRow.querySelectorAll('img').forEach(im => im.style.borderColor = '#cbd5e1');
              thumb.style.borderColor = '#2563eb';
            };
            imgRow.appendChild(thumb);
          });
          gallery.appendChild(imgRow);
          metaNotice.appendChild(gallery);
        }

        // Drive status
        const driveBadge = $('detected-drive-badge');
        const driveBtn = $('btn-view-drive-full');
        if (data.drive_saved && data.drive_links) {
          if (driveBadge) driveBadge.style.display = 'inline-block';
          const link = data.drive_links.full || data.drive_links.mini || data.drive_full_folder;
          if (link && driveBtn) {
            driveBtn.href = link;
            driveBtn.style.display = 'inline-flex';
          }
        } else {
          if (driveBadge) driveBadge.style.display = 'none';
          if (driveBtn) driveBtn.style.display = 'none';
        }

        // Action buttons
        if ($('btn-download-full')) {
          $('btn-download-full').onclick = () => {
            if (data.full_pdf_b64) {
              downloadB64(data.full_pdf_b64, data.full_pdf_filename || 'NUNES_Full_Catalogue.pdf');
            }
          };
        }

        if ($('btn-download-mini')) {
          $('btn-download-mini').onclick = () => {
            if (data.mini_pdf_b64) {
              downloadB64(data.mini_pdf_b64, data.mini_pdf_filename || 'NUNES_Mini_Catalogue.pdf');
            }
          };
        }

        if ($('btn-preview-pdf')) {
          $('btn-preview-pdf').onclick = () => {
            if (data.full_pdf_b64) {
              previewPdf(data.full_pdf_b64, data.full_pdf_filename || 'NUNES_Full_Catalogue.pdf');
            }
          };
        }

        if ($('btn-export-docx')) {
          $('btn-export-docx').onclick = () => {
            exportDocx(data);
          };
        }

        if ($('btn-export-excel')) {
          $('btn-export-excel').onclick = () => {
            exportExcel(data);
          };
        }

        if ($('btn-load-editor')) {
          $('btn-load-editor').onclick = () => {
            loadIntoEditor(data);
          };
        }

        progress.style.display = 'none';
        resultBox.style.display = 'block';

      } catch (err) {
        progress.style.display = 'block';
        progress.className = 'notice error';
        statusText.textContent = 'Upload processing failed: ' + err.message;
      }
    }

    async function handleBatchUpload(files) {
      if (!files || files.length === 0) return;

      batchResults = [];
      progress.style.display = 'block';
      progress.className = 'notice';
      resultBox.style.display = 'none';
      if (batchContainer) {
        batchContainer.style.display = 'block';
        if (batchTable) batchTable.innerHTML = '<table style="width:100%;font-size:12px;border-collapse:collapse"><thead style="background:#e2e8f0;text-align:left"><tr><th style="padding:6px 8px">File</th><th style="padding:6px 8px">Product</th><th style="padding:6px 8px">Format</th><th style="padding:6px 8px">Full PDF</th><th style="padding:6px 8px">Mini PDF</th></tr></thead><tbody id="batch-tbody"></tbody></table>';
      }

      const tbody = $('batch-tbody');
      const adminKey = localStorage.getItem('nunes_admin_key');
      const upHeaders = {};
      if (adminKey) upHeaders['X-Nunes-Key'] = adminKey;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        statusText.textContent = `Processing (${i + 1}/${files.length}): "${file.name}"…`;

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e2e8f0';
        tr.innerHTML = `<td style="padding:6px 8px;font-weight:600">${file.name}</td><td style="padding:6px 8px;color:#64748b" id="b-prod-${i}">Processing…</td><td style="padding:6px 8px;color:#64748b" id="b-fmt-${i}">-</td><td style="padding:6px 8px" id="b-full-${i}">⏳</td><td style="padding:6px 8px" id="b-mini-${i}">⏳</td>`;
        if (tbody) tbody.appendChild(tr);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('save_drive', '1');

        try {
          const res = await fetch('/api/catalogue/upload-auto-generate', {
            method: 'POST',
            headers: upHeaders,
            body: formData
          });
          const data = await res.json();
          if (res.ok && data.success) {
            batchResults.push(data);
            const pCell = $(`b-prod-${i}`);
            const fCell = $(`b-fmt-${i}`);
            const fullCell = $(`b-full-${i}`);
            const miniCell = $(`b-mini-${i}`);

            if (pCell) pCell.innerHTML = `<strong>${data.product_name}</strong> (${data.source_model || 'VT'})`;
            if (fCell) fCell.innerHTML = `<span style="background:#e0f2fe;color:#0369a1;padding:1px 5px;border-radius:3px;font-size:11px;font-weight:bold">${data.detected_format}</span>`;
            if (fullCell) {
              const b = document.createElement('button');
              b.className = 'btn alt';
              b.style.fontSize = '11px';
              b.style.padding = '2px 8px';
              b.textContent = '📄 Download';
              b.onclick = () => downloadB64(data.full_pdf_b64, data.full_pdf_filename);
              fullCell.innerHTML = '';
              fullCell.appendChild(b);
            }
            if (miniCell) {
              const b = document.createElement('button');
              b.className = 'btn alt';
              b.style.fontSize = '11px';
              b.style.padding = '2px 8px';
              b.textContent = '📑 Download';
              b.onclick = () => downloadB64(data.mini_pdf_b64, data.mini_pdf_filename);
              miniCell.innerHTML = '';
              miniCell.appendChild(b);
            }
          } else {
            const pCell = $(`b-prod-${i}`);
            if (pCell) pCell.innerHTML = `<span style="color:#ef4444">Failed: ${data.error || 'Error'}</span>`;
          }
        } catch (e) {
          const pCell = $(`b-prod-${i}`);
          if (pCell) pCell.innerHTML = `<span style="color:#ef4444">Network error: ${e.message}</span>`;
        }
      }

      progress.style.display = 'none';
      if (btnDownloadAllZip && batchResults.length > 0) {
        btnDownloadAllZip.disabled = false;
        btnDownloadAllZip.onclick = () => {
          // Download all full PDFs in sequence
          batchResults.forEach((bData, idx) => {
            setTimeout(() => {
              downloadB64(bData.full_pdf_b64, bData.full_pdf_filename);
            }, idx * 400);
          });
        };
      }
    }

    function previewPdf(b64, name) {
      const byteChars = atob(b64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const previewBox = $('preview');
      if (previewBox) {
        previewBox.innerHTML = `<iframe src="${url}" style="width:100%;height:680px;border:none;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.08);"></iframe>`;
        const dlBtn = $('download');
        if (dlBtn) {
          dlBtn.disabled = false;
          dlBtn.onclick = () => downloadB64(b64, name);
        }
        const zoomBtn = $('zoomin');
        if (zoomBtn) {
          zoomBtn.disabled = false;
          zoomBtn.onclick = () => window.open(url, '_blank');
        }
        const previewCard = $('preview-card') || previewBox;
        previewCard.scrollIntoView({ behavior: 'smooth' });
      }
    }

    async function exportDocx(data) {
      const upHeaders = { 'Content-Type': 'application/json' };
      const adminKey = localStorage.getItem('nunes_admin_key');
      if (adminKey) upHeaders['X-Nunes-Key'] = adminKey;

      try {
        const res = await fetch('/api/export/docx', {
          method: 'POST',
          headers: upHeaders,
          body: JSON.stringify({
            product: data.product_name,
            model: data.source_model,
            specifications: data.spec_list,
            description: data.description,
            features: data.features
          })
        });
        if (!res.ok) throw new Error('DOCX export failed');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.product_name || 'Product'}_Datasheet.docx`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
      } catch (err) {
        alert('Word document export failed: ' + err.message);
      }
    }

    async function exportExcel(data) {
      const upHeaders = { 'Content-Type': 'application/json' };
      const adminKey = localStorage.getItem('nunes_admin_key');
      if (adminKey) upHeaders['X-Nunes-Key'] = adminKey;

      try {
        const res = await fetch('/api/export/excel', {
          method: 'POST',
          headers: upHeaders,
          body: JSON.stringify({
            product: data.product_name,
            model: data.source_model,
            specifications: data.spec_list
          })
        });
        if (!res.ok) throw new Error('Excel export failed');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.product_name || 'Product'}_Specifications.xlsx`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
      } catch (err) {
        alert('Excel export failed: ' + err.message);
      }
    }

    function downloadB64(b64, filename) {
      const byteChars = atob(b64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 500);
    }

    function loadIntoEditor(data) {
      if ($('product')) $('product').value = data.product_name || '';
      if ($('model')) $('model').value = data.source_model || data.model || '';
      if ($('specs')) {
        $('specs').value = data.specifications || '';
        $('specs').dispatchEvent(new Event('input', { bubbles: true }));
      }
      if ($('description')) $('description').value = data.description || '';
      if ($('features')) {
        const feats = Array.isArray(data.features) ? data.features.join('\n') : (data.features || '');
        $('features').value = feats;
      }
      if ($('applications')) {
        const apps = Array.isArray(data.applications) ? data.applications.join('\n') : (data.applications || '');
        $('applications').value = apps;
      }
      if ($('imageview') && data.photo_data_b64) {
        $('imageview').src = data.photo_data_b64;
        $('imageview').hidden = false;
      }
      const editor = $('editor');
      if (editor) {
        editor.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
})();
