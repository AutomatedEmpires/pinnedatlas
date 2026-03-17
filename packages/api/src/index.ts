import app from './app';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

app.listen(PORT, () => {
  console.log(`[WHC API] Server running on http://localhost:${PORT}`);
  console.log(`[WHC API] Health: http://localhost:${PORT}/health`);
});
