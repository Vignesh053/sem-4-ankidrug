import React, { useState } from 'react';
import { AppSettings } from '../types';

interface Props {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);

  // Helper to handle number inputs
  const handleChange = (field: keyof AppSettings, value: string | boolean) => {
    if (typeof value === 'boolean') {
      setFormData({ ...formData, [field]: value });
    } else {
      setFormData({ ...formData, [field]: Number(value) });
    }
  };

  const handleLearningStepsChange = (val: string) => {
    const steps = val.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
    setFormData({ ...formData, learningSteps: steps });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Customize your learning experience.</p>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Daily Limits */}
          <section>
            <h3 className="text-sm uppercase tracking-wide text-blue-600 font-bold mb-3">Daily Limits</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New cards / day</label>
                <input 
                  type="number" 
                  value={formData.newCardsPerDay}
                  onChange={(e) => handleChange('newCardsPerDay', e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reviews / day</label>
                <input 
                  type="number" 
                  value={formData.reviewsPerDay}
                  onChange={(e) => handleChange('reviewsPerDay', e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </section>

          {/* Learning Steps */}
          <section>
            <h3 className="text-sm uppercase tracking-wide text-blue-600 font-bold mb-3">Learning Algorithm</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Learning Steps (minutes)</label>
                <input 
                  type="text" 
                  value={formData.learningSteps.join(', ')}
                  onChange={(e) => handleLearningStepsChange(e.target.value)}
                  placeholder="e.g. 1, 10"
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Comma separated values (e.g. "1, 10")</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Starting Ease</label>
                   <input 
                      type="number" 
                      step="0.1"
                      value={formData.initialEaseFactor}
                      onChange={(e) => handleChange('initialEaseFactor', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Easy Bonus</label>
                   <input 
                      type="number" 
                      step="0.1"
                      value={formData.easyBonus}
                      onChange={(e) => handleChange('easyBonus', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section>
            <h3 className="text-sm uppercase tracking-wide text-blue-600 font-bold mb-3">Appearance</h3>
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <span className="text-gray-700 dark:text-white font-medium">Dark Mode</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.darkMode} 
                    onChange={(e) => handleChange('darkMode', e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
            </div>
          </section>
        </div>

        <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(formData)} 
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium shadow-lg hover:bg-blue-700 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
