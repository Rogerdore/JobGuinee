import { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';

interface Application {
  id: string;
  ai_score: number;
  ai_category: string;
  workflow_stage: string;
  applied_at: string;
  candidate?: {
    profile?: {
      full_name: string;
      email: string;
      phone?: string;
    };
    title?: string;
    experience_years?: number;
    education_level?: string;
    skills?: string[];
  };
}

interface ExportApplicationsButtonProps {
  applications: Application[];
  isPremium: boolean;
  jobTitle?: string;
}

export default function ExportApplicationsButton({ applications, isPremium, jobTitle }: ExportApplicationsButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const exportToCSV = () => {
    const formatData = (apps: Application[]) => apps.map(app => ({
      Candidat: app.candidate?.profile?.full_name || 'Candidat',
      Email: app.candidate?.profile?.email || '',
      Téléphone: app.candidate?.profile?.phone || '',
      Poste: app.candidate?.title || '',
      'Expérience (années)': app.candidate?.experience_years || 0,
      'Niveau d\'études': app.candidate?.education_level || '',
      Compétences: app.candidate?.skills?.join(', ') || '',
      'Score IA': `${app.ai_score || 0}%`,
      Catégorie: app.ai_category === 'strong' ? 'Fort' : app.ai_category === 'medium' ? 'Moyen' : 'Faible',
      Statut: app.workflow_stage || 'received',
      'Date de candidature': new Date(app.applied_at).toLocaleDateString('fr-FR')
    }));

    let csvContent = '';

    if (isPremium) {
      const strongApps = applications.filter(app => app.ai_category === 'strong');
      const mediumApps = applications.filter(app => app.ai_category === 'medium');
      const weakApps = applications.filter(app => app.ai_category === 'weak');

      const createSection = (title: string, apps: Application[]) => {
        if (apps.length === 0) return '';
        const data = formatData(apps);
        let section = `\n"${title}",\n`;
        section += Object.keys(data[0] || {}).join(',') + '\n';
        section += data.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n');
        return section + '\n';
      };

      csvContent = `"${jobTitle || 'Candidatures'}"," - Export Premium avec tri IA"\n`;
      csvContent += `"Date d'export:",${new Date().toLocaleDateString('fr-FR')}\n`;
      csvContent += `"Total candidatures:",${applications.length}\n`;
      csvContent += createSection(`Profils Forts (${strongApps.length})`, strongApps);
      csvContent += createSection(`Profils Moyens (${mediumApps.length})`, mediumApps);
      csvContent += createSection(`Profils Faibles (${weakApps.length})`, weakApps);
    } else {
      const data = formatData(applications);
      csvContent = `"${jobTitle || 'Candidatures'}"\n`;
      csvContent += `"Date d'export:",${new Date().toLocaleDateString('fr-FR')}\n`;
      csvContent += `"Total candidatures:",${applications.length}\n\n`;
      csvContent += Object.keys(data[0] || {}).join(',') + '\n';
      csvContent += data.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n');
    }

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidatures_${jobTitle?.replace(/\s+/g, '_') || 'export'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const exportToExcel = () => {
    const formatData = (apps: Application[]) => apps.map(app => ({
      Candidat: app.candidate?.profile?.full_name || 'Candidat',
      Email: app.candidate?.profile?.email || '',
      Téléphone: app.candidate?.profile?.phone || '',
      Poste: app.candidate?.title || '',
      'Expérience (années)': app.candidate?.experience_years || 0,
      'Niveau d\'études': app.candidate?.education_level || '',
      Compétences: app.candidate?.skills?.join(', ') || '',
      'Score IA': `${app.ai_score || 0}%`,
      Catégorie: app.ai_category === 'strong' ? 'Fort' : app.ai_category === 'medium' ? 'Moyen' : 'Faible',
      Statut: app.workflow_stage || 'received',
      'Date de candidature': new Date(app.applied_at).toLocaleDateString('fr-FR')
    }));

    const createTable = (title: string, data: any[], bgColor: string) => {
      let table = `<tr><td colspan="11" style="background-color: ${bgColor}; color: white; font-weight: bold; padding: 12px; font-size: 14px; border: 2px solid #ddd;">${title}</td></tr>`;

      if (data.length === 0) {
        return table + `<tr><td colspan="11" style="padding: 8px; text-align: center; font-style: italic; color: #666;">Aucune candidature</td></tr><tr><td colspan="11" style="height: 20px;"></td></tr>`;
      }

      table += '<tr style="background-color: #f0f0f0; font-weight: bold;">';
      Object.keys(data[0] || {}).forEach(key => {
        table += `<th style="padding: 8px; border: 1px solid #ddd; text-align: left;">${key}</th>`;
      });
      table += '</tr>';

      data.forEach((row, idx) => {
        table += `<tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9f9f9'};">`;
        Object.values(row).forEach(val => {
          table += `<td style="padding: 8px; border: 1px solid #ddd;">${val}</td>`;
        });
        table += '</tr>';
      });

      table += '<tr><td colspan="11" style="height: 20px;"></td></tr>';
      return table;
    };

    let worksheets = '';
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>';

    if (isPremium) {
      const strongApps = applications.filter(app => app.ai_category === 'strong');
      const mediumApps = applications.filter(app => app.ai_category === 'medium');
      const weakApps = applications.filter(app => app.ai_category === 'weak');

      worksheets = '<x:ExcelWorksheet><x:Name>Candidatures par Catégorie</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>';

      html += worksheets + '</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><meta http-equiv="content-type" content="text/plain; charset=UTF-8"/></head><body>';

      html += `<table><tr><td colspan="11" style="background-color: #0E2F56; color: white; font-weight: bold; padding: 16px; font-size: 18px; text-align: center; border: 2px solid #0E2F56;">${jobTitle || 'Candidatures'} - Export Premium avec tri IA</td></tr>`;
      html += `<tr><td colspan="11" style="padding: 8px; text-align: center;">Date d'export: ${new Date().toLocaleDateString('fr-FR')} | Total: ${applications.length} candidatures</td></tr>`;
      html += '<tr><td colspan="11" style="height: 20px;"></td></tr>';

      html += createTable(`✅ Profils Forts (${strongApps.length})`, formatData(strongApps), '#16a34a');
      html += createTable(`⚠️ Profils Moyens (${mediumApps.length})`, formatData(mediumApps), '#ca8a04');
      html += createTable(`❌ Profils Faibles (${weakApps.length})`, formatData(weakApps), '#dc2626');

      html += '</table>';
    } else {
      const data = formatData(applications);
      worksheets = '<x:ExcelWorksheet><x:Name>Candidatures</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>';

      html += worksheets + '</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><meta http-equiv="content-type" content="text/plain; charset=UTF-8"/></head><body>';

      html += `<table><tr><td colspan="11" style="background-color: #0E2F56; color: white; font-weight: bold; padding: 16px; font-size: 18px; text-align: center;">${jobTitle || 'Candidatures'}</td></tr>`;
      html += `<tr><td colspan="11" style="padding: 8px; text-align: center;">Date d'export: ${new Date().toLocaleDateString('fr-FR')} | Total: ${applications.length} candidatures</td></tr>`;
      html += '<tr><td colspan="11" style="height: 20px;"></td></tr>';

      html += '<tr style="background-color: #0E2F56; color: white; font-weight: bold;">';
      Object.keys(data[0] || {}).forEach(key => {
        html += `<th style="padding: 8px; border: 1px solid #ddd; text-align: left;">${key}</th>`;
      });
      html += '</tr>';

      data.forEach((row, idx) => {
        html += `<tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9f9f9'};">`;
        Object.values(row).forEach(val => {
          html += `<td style="padding: 8px; border: 1px solid #ddd;">${val}</td>`;
        });
        html += '</tr>';
      });

      html += '</table>';
    }

    html += '</body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidatures_${jobTitle?.replace(/\s+/g, '_') || 'export'}_${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    window.URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const exportToPDF = () => {
    const data = applications.map(app => ({
      Candidat: app.candidate?.profile?.full_name || 'Candidat',
      Email: app.candidate?.profile?.email || '',
      Téléphone: app.candidate?.profile?.phone || '',
      Poste: app.candidate?.title || '',
      'Expérience': `${app.candidate?.experience_years || 0} ans`,
      'Niveau': app.candidate?.education_level || '',
      'Score IA': `${app.ai_score || 0}%`,
      Catégorie: app.ai_category === 'strong' ? 'Fort' : app.ai_category === 'medium' ? 'Moyen' : 'Faible',
      Statut: app.workflow_stage || 'received',
      Date: new Date(app.applied_at).toLocaleDateString('fr-FR')
    }));

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Candidatures - ${new Date().toLocaleDateString('fr-FR')}</title>
        <style>
          @page { size: A4 landscape; margin: 1cm; }
          body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            margin: 0;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #0E2F56, #1a4275);
            color: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
          }
          .header h1 { margin: 0 0 10px 0; font-size: 24px; }
          .header p { margin: 0; opacity: 0.9; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background-color: #0E2F56;
            color: white;
            padding: 10px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
          }
          td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
          }
          tr:nth-child(even) { background-color: #f9f9f9; }
          tr:hover { background-color: #f0f7ff; }
          .badge-strong {
            background: #dcfce7;
            color: #166534;
            padding: 2px 8px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 10px;
          }
          .badge-medium {
            background: #fef9c3;
            color: #854d0e;
            padding: 2px 8px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 10px;
          }
          .badge-weak {
            background: #fee2e2;
            color: #991b1b;
            padding: 2px 8px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 10px;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 10px;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
          }
          @media print {
            body { padding: 0; }
            .header { break-inside: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📋 Rapport des Candidatures</h1>
          <p>Généré le ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          <p>Nombre total de candidatures: ${applications.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Candidat</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Poste</th>
              <th>Exp.</th>
              <th>Niveau</th>
              <th>Score IA</th>
              <th>Catégorie</th>
              <th>Statut</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.forEach(row => {
      const badgeClass = row.Catégorie === 'Fort' ? 'badge-strong' :
                         row.Catégorie === 'Moyen' ? 'badge-medium' : 'badge-weak';
      html += `
        <tr>
          <td><strong>${row.Candidat}</strong></td>
          <td>${row.Email}</td>
          <td>${row.Téléphone}</td>
          <td>${row.Poste}</td>
          <td>${row.Expérience}</td>
          <td>${row.Niveau}</td>
          <td><strong>${row['Score IA']}</strong></td>
          <td><span class="${badgeClass}">${row.Catégorie}</span></td>
          <td>${row.Statut}</td>
          <td>${row.Date}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
        <div class="footer">
          <p>Document confidentiel - Réservé à un usage interne uniquement</p>
          <p>Généré par le Système de Recrutement ATS</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      setShowMenu(false);
    }, 250);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="px-4 py-2 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-700 font-medium rounded-xl transition flex items-center gap-2 shadow-sm"
      >
        <Download className="w-5 h-5" />
        Exporter
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-50 overflow-hidden animate-fade-in">
          <div className="p-3 bg-gradient-to-r from-[#0E2F56] to-blue-700 text-white">
            <p className="font-semibold text-sm">Choisir le format d'export</p>
            <p className="text-xs text-blue-200 mt-1">{applications.length} candidature{applications.length > 1 ? 's' : ''}</p>
          </div>

          <div className="p-2">
            <button
              onClick={exportToExcel}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 rounded-lg transition-colors group text-left"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <FileSpreadsheet className="w-5 h-5 text-green-700" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">Excel (.xls)</p>
                <p className="text-xs text-gray-500">Format tableur</p>
              </div>
            </button>

            <button
              onClick={exportToPDF}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-lg transition-colors group text-left mt-1"
            >
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <FileText className="w-5 h-5 text-red-700" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">PDF</p>
                <p className="text-xs text-gray-500">Document imprimable</p>
              </div>
            </button>

            <button
              onClick={exportToCSV}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-lg transition-colors group text-left mt-1"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <File className="w-5 h-5 text-blue-700" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">CSV</p>
                <p className="text-xs text-gray-500">Valeurs séparées</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
