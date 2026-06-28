import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import api from "../api/client.js";

const AiAssistant = () => {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api
      .get("/chat/history")
      .then(({ data }) => setHistory(data.history.reverse()))
      .catch((error) => toast.error(error.message));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    const currentMessage = message.trim();
    setMessage("");
    setLoading(true);

    try {
      const { data } = await api.post("/chat", { message: currentMessage });
      setHistory((current) => [
        ...current,
        {
          _id: data.historyId,
          message: currentMessage,
          response: data.response,
          recommendations: data.recommendations,
          createdAt: new Date().toISOString()
        }
      ]);
    } catch (error) {
      toast.error(error.message);
      setMessage(currentMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="panel flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-100">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">AI Health Assistant</h2>
              <p className="muted">Say hi for help, or ask a health-related question. Recommendations are limited to available, non-expired inventory.</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {!history.length ? (
            <div className="mx-auto mt-16 max-w-md text-center">
              <Sparkles className="mx-auto h-10 w-10 text-medical-600" />
              <h3 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">Ask a health question</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Example: I have headache and fever. If you just say hi, I’ll greet you and ask for a health-related question.
              </p>
            </div>
          ) : null}

          {history.map((item) => (
            <article key={item._id || item.createdAt} className="space-y-3">
              <div className="ml-auto max-w-2xl rounded-lg bg-primary-600 px-4 py-3 text-sm text-white">
                {item.message}
              </div>
              <div className="max-w-3xl rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                <div className="whitespace-pre-wrap leading-6">{item.response}</div>
                {item.recommendations?.length ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {item.recommendations.map((recommendation) => (
                      recommendation.medicineId ? (
                        <Link
                          key={recommendation.medicineId?._id || recommendation.medicineId || recommendation.name}
                          to={`/medicines/${recommendation.medicineId?._id || recommendation.medicineId}`}
                          className="rounded-md border border-slate-200 bg-white p-3 transition hover:border-primary-300 dark:border-slate-800 dark:bg-slate-900"
                        >
                          <p className="font-semibold text-slate-950 dark:text-white">{recommendation.name}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                            {recommendation.usage}
                          </p>
                        </Link>
                      ) : (
                        <div
                          key={recommendation.name}
                          className="rounded-md border border-dashed border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-slate-950 dark:text-white">{recommendation.name}</p>
                            <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-500/15 dark:text-amber-100">
                              Reference
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                            {recommendation.usage}
                          </p>
                        </div>
                      )
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking through available inventory...
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <form className="border-t border-slate-200 p-4 dark:border-slate-800" onSubmit={handleSubmit}>
          <div className="flex gap-3">
            <input
              className="input"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="I have fever and headache"
              disabled={loading}
            />
            <button className="btn btn-primary px-4" type="submit" disabled={loading || !message.trim()}>
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </form>
      </section>

      <aside className="space-y-4">
        <div className="panel p-5">
          <h3 className="font-semibold text-slate-950 dark:text-white">Safety Rules</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <p>No disease diagnosis.</p>
            <p>Only stocked, non-expired medicines can be recommended.</p>
            <p>Serious symptoms always need medical care.</p>
          </div>
        </div>
        <div className="panel p-5">
          <h3 className="font-semibold text-slate-950 dark:text-white">Recent Chats</h3>
          <div className="mt-4 space-y-3">
            {history
              .slice(-5)
              .reverse()
              .map((item) => (
                <p key={`recent-${item._id || item.createdAt}`} className="rounded-md bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                  {item.message}
                </p>
              ))}
            {!history.length ? <p className="muted">No chat history yet.</p> : null}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default AiAssistant;
