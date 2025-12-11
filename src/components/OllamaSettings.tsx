import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import type { AISettings } from '../types';
import Spinner from './common/Spinner';
import { initializeOllamaClient, testOllamaConnection, fetchOllamaModels } from '../services/ollamaClient';

interface OllamaSettingsProps {
    schoolId: number;
}

const OllamaSettings: React.FC<OllamaSettingsProps> = ({ schoolId }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [fetchingModels, setFetchingModels] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    
    const [formData, setFormData] = useState<{
        ollama_url: string;
        ollama_model: string;
    }>({
        ollama_url: 'http://localhost:11434',
        ollama_model: 'llama3'
    });

    useEffect(() => {
        fetchSettings();
    }, [schoolId]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('schools')
                .select('ai_settings')
                .eq('id', schoolId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching AI settings:', error);
            }
            
            if (data?.ai_settings) {
                setFormData({
                    ollama_url: data.ai_settings.ollama_url || 'http://localhost:11434',
                    ollama_model: data.ai_settings.ollama_model || 'llama3'
                });
            }
        } catch (error) {
            console.error('Error fetching AI settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFetchModels = async () => {
        setFetchingModels(true);
        setTestResult(null);
        
        try {
            // Initialize with current URL
            initializeOllamaClient(formData.ollama_url);
            
            const models = await fetchOllamaModels();
            const modelNames = models.map(m => m.name);
            setAvailableModels(modelNames);
            
            if (modelNames.length > 0) {
                setTestResult({ 
                    success: true, 
                    message: `✓ Found ${modelNames.length} model(s)` 
                });
                
                // Set first model as default if current model not in list
                if (!modelNames.includes(formData.ollama_model) && modelNames.length > 0) {
                    setFormData(prev => ({ ...prev, ollama_model: modelNames[0] }));
                }
            } else {
                setTestResult({ 
                    success: false, 
                    message: 'No models found. Please pull a model using: ollama pull llama3' 
                });
            }
        } catch (error: any) {
            console.error('Error fetching models:', error);
            setTestResult({ 
                success: false, 
                message: `Failed to fetch models: ${error.message}` 
            });
            setAvailableModels([]);
        } finally {
            setFetchingModels(false);
        }
    };

    const handleTestConnection = async () => {
        setTesting(true);
        setTestResult(null);

        try {
            initializeOllamaClient(formData.ollama_url);
            const result = await testOllamaConnection();
            setTestResult(result);
            
            // If successful, also fetch models
            if (result.success) {
                await handleFetchModels();
            }
        } catch (error: any) {
            console.error('Test connection error:', error);
            setTestResult({ 
                success: false, 
                message: `Connection failed: ${error.message}` 
            });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setTestResult(null);
        
        try {
            // Fetch current AI settings
            const { data: currentData, error: fetchError } = await supabase
                .from('schools')
                .select('ai_settings')
                .eq('id', schoolId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            // Merge with existing settings
            const aiSettings: AISettings = {
                ...(currentData?.ai_settings || {}),
                ollama_url: formData.ollama_url,
                ollama_model: formData.ollama_model,
                is_configured: true
            };

            const { error } = await supabase
                .from('schools')
                .update({ ai_settings: aiSettings })
                .eq('id', schoolId);

            if (error) throw error;

            alert('Ollama Configuration saved successfully!');
            await fetchSettings();
        } catch (error: any) {
            console.error('Error saving Ollama settings:', error);
            alert(`Failed to save settings: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                    Ollama Configuration (Local AI)
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    Configure Ollama for free, local AI processing. No API key required!
                </p>
            </div>

            {/* Ollama URL Input */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Ollama Server URL
                </label>
                <input
                    type="text"
                    value={formData.ollama_url}
                    onChange={(e) => setFormData({ ...formData, ollama_url: e.target.value })}
                    placeholder="http://localhost:11434"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Default: http://localhost:11434 (leave as-is if Ollama is running locally)
                </p>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Ollama Model
                    </label>
                    <button
                        onClick={handleFetchModels}
                        disabled={fetchingModels}
                        className="text-sm px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50"
                    >
                        {fetchingModels ? 'Fetching...' : '🔄 Refresh Models'}
                    </button>
                </div>
                
                {availableModels.length > 0 ? (
                    <select
                        value={formData.ollama_model}
                        onChange={(e) => setFormData({ ...formData, ollama_model: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                        {availableModels.map((model) => (
                            <option key={model} value={model}>
                                {model}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        type="text"
                        value={formData.ollama_model}
                        onChange={(e) => setFormData({ ...formData, ollama_model: e.target.value })}
                        placeholder="llama3"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                )}
                
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    {availableModels.length > 0 
                        ? `${availableModels.length} model(s) available` 
                        : 'Click "Test Connection" to see available models'}
                </p>
            </div>

            {/* Test Result */}
            {testResult && (
                <div className={`p-4 rounded-lg border ${
                    testResult.success 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' 
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                }`}>
                    {testResult.message}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {testing ? 'Testing...' : '🔌 Test Connection'}
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {saving ? 'Saving...' : '💾 Save Configuration'}
                </button>
            </div>

            {/* Help Section */}
            <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                    📚 Setting Up Ollama
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <li>Download Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">ollama.ai</a></li>
                    <li>Install and run Ollama on your computer</li>
                    <li>Pull a model: <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">ollama pull llama3</code></li>
                    <li>Click "Test Connection" above to verify</li>
                    <li>Select your preferred model and save</li>
                </ol>
                <p className="mt-4 text-xs text-blue-700 dark:text-blue-300">
                    💡 <strong>Recommended models:</strong> llama3 (balanced), llama3:8b (fast), mistral (good reasoning)
                </p>
            </div>

            {/* Benefits Section */}
            <div className="mt-6 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">
                    ✨ Benefits of Local AI with Ollama
                </h4>
                <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
                    <li>✓ <strong>100% Free</strong> - No API costs or subscriptions</li>
                    <li>✓ <strong>Private</strong> - Your data never leaves your computer</li>
                    <li>✓ <strong>Fast</strong> - No network latency</li>
                    <li>✓ <strong>Offline</strong> - Works without internet connection</li>
                    <li>✓ <strong>No Limits</strong> - Unlimited requests</li>
                </ul>
            </div>
        </div>
    );
};

export default OllamaSettings;
