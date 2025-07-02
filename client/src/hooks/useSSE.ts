import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useSSE(isAuthenticated: boolean) {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Only connect if authenticated
    if (!isAuthenticated) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    // Prevent multiple connections
    if (eventSourceRef.current) {
      return;
    }

    const eventSource = new EventSource('/events');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE connection opened for real-time agent updates');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'agent_update') {
          // Invalidate all agent-related queries to trigger refresh across all interfaces
          queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
          queryClient.invalidateQueries({ queryKey: ['/api/admin/agents'] });
          queryClient.invalidateQueries({ queryKey: ['/api/agents/managed'] });
          queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
          
          console.log(`실시간 에이전트 아이콘 업데이트 수신됨 (에이전트 ID: ${data.agentId})`);
        }
      } catch (error) {
        console.error('SSE 메시지 파싱 오류:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE 연결 오류:', error);
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        console.log('SSE 연결 종료됨');
      }
    };
  }, [isAuthenticated, queryClient]);
}