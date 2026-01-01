import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Eye, EyeOff, GripVertical, Menu as MenuIcon, Link as LinkIcon, ChevronDown, ArrowLeft } from 'lucide-react';
import cmsService, { NavigationItem, CMSPage } from '../../services/cmsService';

interface NavigationManagerProps {
  onRefresh: () => void;
}

export default function NavigationManager({ onRefresh }: NavigationManagerProps) {
  const [navItems, setNavItems] = useState<NavigationItem[]>([]);
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<'main' | 'footer' | 'mobile' | 'sidebar'>('main');
  const [formData, setFormData] = useState({
    label: '',
    type: 'link' as 'link' | 'dropdown' | 'custom',
    url: '',
    page_id: '',
    external: false,
    target: '_self' as '_self' | '_blank',
    icon: '',
    parent_id: '',
    display_order: 0,
    visible: true,
    menu_position: 'main' as 'main' | 'footer' | 'mobile' | 'sidebar',
    roles: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsData, pagesData] = await Promise.all([
        cmsService.getNavigationItems(),
        cmsService.getPages(),
      ]);
      setNavItems(itemsData);
      setPages(pagesData.filter(p => p.status === 'published'));
    } catch (error) {
      console.error('Error loading navigation data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const itemData = {
        label: formData.label,
        type: formData.type,
        url: formData.url || undefined,
        page_id: formData.page_id || undefined,
        external: formData.external,
        target: formData.target,
        icon: formData.icon || undefined,
        parent_id: formData.parent_id || undefined,
        display_order: formData.display_order,
        visible: formData.visible,
        menu_position: formData.menu_position,
        roles: formData.roles.length > 0 ? formData.roles : undefined,
      };

      if (editingItem) {
        await cmsService.updateNavigationItem(editingItem.id, itemData);
      } else {
        await cmsService.createNavigationItem(itemData);
      }

      setShowForm(false);
      resetForm();
      await loadData();
      onRefresh();
      alert(editingItem ? 'Élément mis à jour!' : 'Élément créé!');
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: NavigationItem) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      type: item.type,
      url: item.url || '',
      page_id: item.page_id || '',
      external: item.external || false,
      target: item.target || '_self',
      icon: item.icon || '',
      parent_id: item.parent_id || '',
      display_order: item.display_order,
      visible: item.visible,
      menu_position: item.menu_position,
      roles: item.roles || [],
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cet élément de navigation ?')) return;

    try {
      await cmsService.deleteNavigationItem(id);
      await loadData();
      onRefresh();
      alert('Élément supprimé!');
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleToggleVisibility = async (item: NavigationItem) => {
    try {
      await cmsService.updateNavigationItem(item.id, {
        visible: !item.visible,
      });
      await loadData();
      onRefresh();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      label: '',
      type: 'link',
      url: '',
      page_id: '',
      external: false,
      target: '_self',
      icon: '',
      parent_id: '',
      display_order: navItems.filter(i => i.menu_position === selectedMenu).length,
      visible: true,
      menu_position: selectedMenu,
      roles: [],
    });
  };

  const filteredItems = navItems.filter(item => item.menu_position === selectedMenu);
  const parentItems = filteredItems.filter(item => !item.parent_id);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'link': return <LinkIcon className="w-4 h-4" />;
      case 'dropdown': return <ChevronDown className="w-4 h-4" />;
      default: return <MenuIcon className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'link': return 'Lien';
      case 'dropdown': return 'Menu déroulant';
      case 'custom': return 'Personnalisé';
      default: return type;
    }
  };

  const menuPositions = [
    { id: 'main', name: 'Menu principal', icon: MenuIcon },
    { id: 'footer', name: 'Pied de page', icon: MenuIcon },
    { id: 'mobile', name: 'Menu mobile', icon: MenuIcon },
    { id: 'sidebar', name: 'Barre latérale', icon: MenuIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestion de la navigation</h2>
          <p className="text-sm text-gray-600 mt-1">Configurez les menus de votre site</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouvel élément
        </button>
      </div>

      <div className="bg-white rounded-xl border-2 border-gray-200">
        <div className="border-b border-gray-200 p-1">
          <div className="flex gap-1">
            {menuPositions.map((menu) => {
              const Icon = menu.icon;
              return (
                <button
                  key={menu.id}
                  onClick={() => setSelectedMenu(menu.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    selectedMenu === menu.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{menu.name}</span>
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                    {navItems.filter(i => i.menu_position === menu.id).length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {parentItems.length > 0 ? (
            <div className="space-y-3">
              {parentItems.map((item) => {
                const children = filteredItems.filter(child => child.parent_id === item.id);
                return (
                  <div key={item.id} className="border-2 border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 p-4 bg-gray-50">
                      <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="font-medium text-gray-900">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs px-2 py-1 bg-white rounded border">{getTypeLabel(item.type)}</span>
                        {!item.visible && (
                          <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">Masqué</span>
                        )}
                        {item.external && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Externe</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleToggleVisibility(item)}
                          className="p-2 hover:bg-white rounded-lg text-gray-600 transition"
                        >
                          {item.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:bg-white rounded-lg text-blue-600 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 hover:bg-white rounded-lg text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {children.length > 0 && (
                      <div className="p-3 space-y-2 border-t">
                        {children.map((child) => (
                          <div key={child.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                            <div className="w-8" />
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{child.label}</span>
                            <div className="flex gap-1 ml-auto">
                              <button
                                onClick={() => handleEdit(child)}
                                className="p-1.5 hover:bg-blue-100 rounded text-blue-600 transition"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(child.id)}
                                className="p-1.5 hover:bg-red-100 rounded text-red-600 transition"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <MenuIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Aucun élément dans ce menu</p>
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Créer le premier élément
              </button>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition group"
                    title="Retour à la liste"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:-translate-x-1 transition-transform" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editingItem ? 'Modifier l\'élément' : 'Nouvel élément de navigation'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {editingItem ? 'Modifiez les propriétés de l\'élément de menu' : 'Créez un nouvel élément de navigation'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-red-100 rounded-lg transition text-gray-600 hover:text-red-600"
                  title="Fermer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Libellé *
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Accueil, À propos, Contact..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="link">Lien simple</option>
                    <option value="dropdown">Menu déroulant</option>
                    <option value="custom">Personnalisé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position du menu *
                  </label>
                  <select
                    value={formData.menu_position}
                    onChange={(e) => setFormData({ ...formData, menu_position: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="main">Menu principal</option>
                    <option value="footer">Pied de page</option>
                    <option value="mobile">Menu mobile</option>
                    <option value="sidebar">Barre latérale</option>
                  </select>
                </div>
              </div>

              {formData.type !== 'dropdown' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lier à une page
                    </label>
                    <select
                      value={formData.page_id}
                      onChange={(e) => setFormData({ ...formData, page_id: e.target.value, url: '' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Aucune page --</option>
                      {pages.map((page) => (
                        <option key={page.id} value={page.id}>
                          {page.title} (/{page.slug})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">OU</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL personnalisée
                    </label>
                    <input
                      type="text"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value, page_id: '' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="/contact, https://example.com"
                    />
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.external}
                        onChange={(e) => setFormData({ ...formData, external: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Lien externe</span>
                    </label>

                    {formData.external && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cible
                        </label>
                        <select
                          value={formData.target}
                          onChange={(e) => setFormData({ ...formData, target: e.target.value as any })}
                          className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="_self">Même onglet</option>
                          <option value="_blank">Nouvel onglet</option>
                        </select>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icône (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="home, user, settings (nom Lucide React)"
                />
              </div>

              {formData.type !== 'dropdown' && parentItems.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Menu parent (optionnel)
                  </label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Aucun parent --</option>
                    {parentItems.filter(item => item.type === 'dropdown').map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={formData.visible}
                      onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Visible</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Enregistrement...' : editingItem ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
