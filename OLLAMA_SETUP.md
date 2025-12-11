# Ollama Setup Guide

This guide will help you set up Ollama for local, free AI processing in School 360.

## What is Ollama?

Ollama is a free, open-source tool that lets you run large language models (LLMs) locally on your computer. This means:

- ✅ **100% Free** - No API costs or subscriptions
- ✅ **Privacy** - Your data never leaves your computer
- ✅ **Fast** - No network latency
- ✅ **Offline** - Works without internet connection
- ✅ **No Limits** - Unlimited requests

## System Requirements

### Minimum Requirements
- **RAM**: 8GB (for 7B models like llama3:8b)
- **Disk Space**: 5-10GB per model
- **OS**: Windows 10+, macOS 11+, or Linux

### Recommended Requirements
- **RAM**: 16GB+ (for larger models like llama3:70b)
- **GPU**: NVIDIA GPU with 6GB+ VRAM (optional, but faster)
- **Disk Space**: 20GB+ for multiple models

## Installation

### Windows

1. **Download Ollama**
   - Visit [https://ollama.ai/download](https://ollama.ai/download)
   - Download the Windows installer
   - Run the installer and follow the prompts

2. **Verify Installation**
   - Open Command Prompt or PowerShell
   - Run: `ollama --version`
   - You should see the version number

3. **Ollama runs as a background service**
   - It automatically starts on system boot
   - Accessible at `http://localhost:11434`

### macOS

1. **Download Ollama**
   - Visit [https://ollama.ai/download](https://ollama.ai/download)
   - Download the macOS installer (.dmg)
   - Drag Ollama to Applications folder

2. **Run Ollama**
   - Open Ollama from Applications
   - It will appear in your menu bar

3. **Verify Installation**
   - Open Terminal
   - Run: `ollama --version`

### Linux

1. **Install via Script**
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Start Ollama Service**
   ```bash
   sudo systemctl start ollama
   sudo systemctl enable ollama  # Auto-start on boot
   ```

3. **Verify Installation**
   ```bash
   ollama --version
   ```

## Pulling Models

After installing Ollama, you need to download (pull) at least one AI model.

### Recommended Models

#### 1. **Llama 3 (8B)** - Best for most users
- **Size**: ~4.7GB
- **Speed**: Fast
- **Quality**: Excellent
- **RAM**: 8GB minimum

```bash
ollama pull llama3
```

#### 2. **Llama 3.1 (8B)** - Latest version
- **Size**: ~4.7GB
- **Speed**: Fast
- **Quality**: Excellent, improved reasoning
- **RAM**: 8GB minimum

```bash
ollama pull llama3.1
```

#### 3. **Mistral** - Good for reasoning
- **Size**: ~4.1GB
- **Speed**: Very fast
- **Quality**: Good reasoning and analysis
- **RAM**: 8GB minimum

```bash
ollama pull mistral
```

#### 4. **Llama 3 (70B)** - Best quality (requires powerful hardware)
- **Size**: ~40GB
- **Speed**: Slower
- **Quality**: Best
- **RAM**: 32GB+ recommended

```bash
ollama pull llama3:70b
```

### Check Available Models

To see which models you've downloaded:

```bash
ollama list
```

### Remove a Model

If you need to free up space:

```bash
ollama rm model-name
```

## Configuring School 360

1. **Open School 360**
   - Log in as an administrator

2. **Navigate to Settings**
   - Click on your profile
   - Go to Settings > AI Configuration

3. **Select Ollama Provider**
   - Click on the "Ollama (Local)" option
   - The default URL `http://localhost:11434` should work for most setups

4. **Test Connection**
   - Click "Test Connection"
   - You should see a success message with available models

5. **Select a Model**
   - Choose from the dropdown (e.g., "llama3")
   - Click "Save Configuration"

6. **You're Done!**
   - All AI features in School 360 will now use your local Ollama instance

## Troubleshooting

### Issue: "Connection failed" error

**Solutions:**

1. **Check if Ollama is running**
   ```bash
   # Windows (PowerShell)
   Get-Process ollama
   
   # macOS/Linux
   ps aux | grep ollama
   ```

2. **Start Ollama manually**
   ```bash
   # macOS/Linux
   ollama serve
   
   # Windows - restart the Ollama service
   ```

3. **Check the port**
   - Ensure nothing else is using port 11434
   - Try accessing http://localhost:11434 in your browser

### Issue: "No models found"

**Solution:**
- You haven't pulled any models yet
- Run: `ollama pull llama3`

### Issue: Model runs slowly

**Solutions:**

1. **Use a smaller model**
   - Switch from `llama3:70b` to `llama3` or `llama3:8b`

2. **Close other applications**
   - Free up RAM and CPU resources

3. **Check system resources**
   ```bash
   # Monitor resource usage
   ollama ps
   ```

### Issue: "Out of memory" error

**Solutions:**

1. **Use a smaller model**
   - `llama3:8b` requires less RAM than `llama3:70b`

2. **Close other applications**

3. **Increase system swap space** (Linux)
   ```bash
   sudo fallocate -l 16G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

### Issue: Can't connect from a different computer

By default, Ollama only accepts connections from localhost. To allow remote connections:

**macOS/Linux:**
```bash
export OLLAMA_HOST=0.0.0.0:11434
ollama serve
```

**Windows:**
Set environment variable `OLLAMA_HOST=0.0.0.0:11434` and restart Ollama service.

**In School 360:**
- Update the Ollama URL to `http://YOUR_SERVER_IP:11434`

## Advanced Configuration

### Custom Port

If you need to run Ollama on a different port:

```bash
# Set environment variable
export OLLAMA_HOST=0.0.0.0:8080

# Start Ollama
ollama serve
```

Update the URL in School 360 settings to match.

### GPU Acceleration

Ollama automatically uses GPU if available. To verify:

```bash
ollama ps
```

Look for GPU utilization in the output.

### Model Parameters

You can customize model behavior by creating a Modelfile:

```bash
# Create a custom model with specific parameters
cat > Modelfile << EOF
FROM llama3
PARAMETER temperature 0.7
PARAMETER num_ctx 4096
EOF

# Create the custom model
ollama create my-llama3 -f Modelfile

# Use it in School 360
```

## Performance Tips

1. **Keep models loaded**
   - First request loads the model (slower)
   - Subsequent requests are much faster
   - Models stay loaded for 5 minutes after last use

2. **Use appropriate model size**
   - 8B models: Good balance of speed and quality
   - 70B models: Best quality, but much slower

3. **Monitor resource usage**
   ```bash
   ollama ps
   ```

4. **Update regularly**
   ```bash
   # Update Ollama
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Re-pull models for updates
   ollama pull llama3
   ```

## Comparing with OpenRouter

| Feature | Ollama (Local) | OpenRouter (Cloud) |
|---------|----------------|-------------------|
| Cost | Free | Pay per use |
| Privacy | Complete | Data sent to cloud |
| Speed | Fast (local) | Depends on internet |
| Internet | Not required | Required |
| Models | Limited to what fits in RAM | Access to many models |
| Setup | Requires installation | Just need API key |
| Limits | None | Based on credits |

## Best Practices

1. **Start with llama3**
   - Good balance of quality and performance
   - Works on most systems

2. **Test before production**
   - Verify AI features work as expected
   - Check response quality

3. **Monitor disk space**
   - Each model takes several GB
   - Remove unused models: `ollama rm model-name`

4. **Keep Ollama updated**
   - Regular updates improve performance
   - New models become available

5. **Use for development/testing**
   - Free and unlimited
   - Switch to OpenRouter for production if needed

## Getting Help

- **Ollama Documentation**: [https://github.com/ollama/ollama](https://github.com/ollama/ollama)
- **Ollama Discord**: [https://discord.gg/ollama](https://discord.gg/ollama)
- **Model Library**: [https://ollama.ai/library](https://ollama.ai/library)

## Switching Between Ollama and OpenRouter

You can easily switch between local (Ollama) and cloud (OpenRouter) AI:

1. Go to Settings > AI Configuration
2. Select the provider you want to use
3. Configure the settings
4. Save

All AI features will immediately use the selected provider. This allows you to:
- Use Ollama for development/testing (free)
- Use OpenRouter for production (more models, potentially better quality)
- Switch based on your current needs

---

**Note**: If you encounter any issues not covered here, please check the Ollama GitHub issues or contact support.
