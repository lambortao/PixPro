import { useState, useEffect } from 'react';

interface UseProgressBarProps {
  loading: boolean;
}

interface UseProgressBarReturn {
  showProgressBar: boolean;
  progress: number;
}

/**
 * 进度条钩子函数
 * @param loading 是否正在加载
 * @returns 进度条相关状态
 */
const useProgressBar = ({ loading }: UseProgressBarProps): UseProgressBarReturn => {
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressTimer, setProgressTimer] = useState<number | null>(null);

  useEffect(() => {
    if (loading) {
      setShowProgressBar(true);
      setProgress(0);
      
      // 模拟进度条，从0开始，每100ms增加1%，最多到95%
      const timer = window.setInterval(() => {
        setProgress(prev => {
          if (prev < 95) {
            return prev + 1;
          }
          return prev;
        });
      }, 100);
      
      setProgressTimer(timer);
    } else {
      // 加载完成后，直接到100%
      if (showProgressBar) {
        setProgress(100);
        
        // 完成后延迟隐藏进度条
        const hideTimer = window.setTimeout(() => {
          setShowProgressBar(false);
        }, 500);
        
        // 清除定时器
        return () => {
          window.clearTimeout(hideTimer);
        };
      }
      
      // 清除进度定时器
      if (progressTimer) {
        window.clearInterval(progressTimer);
        setProgressTimer(null);
      }
    }
    
    return () => {
      if (progressTimer) {
        window.clearInterval(progressTimer);
      }
    };
  }, [loading]);

  return {
    showProgressBar,
    progress
  };
};

export default useProgressBar; 