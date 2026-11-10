import { useEffect, useState } from 'react';
import type { AdminSection } from './components/AdminShell';
import type { PlatformSection } from './components/PlatformShell';
import { LoginPage } from './screens/LoginPage';
import { RegisterPage } from './screens/RegisterPage';
import { BookingDetailsPage } from './screens/BookingDetailsPage';
import { EmployeesPage } from './screens/EmployeesPage';
import { FloorsPage } from './screens/FloorsPage';
import { ReportsPage } from './screens/ReportsPage';
import { RestaurantsPage } from './screens/RestaurantsPage';
import { RoomsPage } from './screens/RoomsPage';
import { SpotBookingPage } from './screens/SpotBookingPage';
import { TablesPage } from './screens/TablesPage';
import { PlatformLoginPage } from './screens/PlatformLoginPage';
import { PlatformClientDetailPage } from './screens/PlatformClientDetailPage';
import { PlatformClientsPage } from './screens/PlatformClientsPage';
import { PlatformPlansPage } from './screens/PlatformPlansPage';
import { PlatformInvoicesPage } from './screens/PlatformInvoicesPage';
import { PlatformSubscriptionsPage } from './screens/PlatformSubscriptionsPage';
import { PlatformOverviewPage } from './screens/PlatformOverviewPage';
import { PlatformReportsPage } from './screens/PlatformReportsPage';
import { TodayPage } from './screens/TodayPage';
import { registerWebPush, unregisterWebPush } from './pushNotifications';
import { clearSession, readSession } from './session';

type Screen = 'login' | 'register' | 'admin';

function useRoute() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const navigate = (next: string) => {
    if (window.location.pathname !== next) {
      window.history.pushState({}, '', next);
    }
    setPath(next);
  };

  return { path, navigate };
}

export function App() {
  const { path, navigate } = useRoute();
  const [screen, setScreen] = useState<Screen>(() => (readSession()?.organizationId ? 'admin' : 'login'));
  const [sessionVersion, setSessionVersion] = useState(0);
  const signedIn = () => {
    setSessionVersion((value) => value + 1);
    setScreen('admin');
  };
  const signedOut = () => {
    void unregisterWebPush().finally(() => {
      clearSession();
      setSessionVersion((value) => value + 1);
      setScreen('login');
    });
  };
  void sessionVersion;

  useEffect(() => {
    if (readSession()?.accessToken) {
      void registerWebPush();
    }
  }, []);

  useEffect(() => {
    if (!path.startsWith('/platform')) {
      document.title = 'DinePoint Admin · Sign in';
    }
  }, [path]);
  const [section, setSection] = useState<AdminSection>('today');
  const [roomFloor, setRoomFloor] = useState<{ id: string; name: string } | null>(null);
  const [tableRoom, setTableRoom] = useState<{ id: string; name: string } | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  if (path === '/platform/login') {
    return (
      <PlatformLoginPage
        onOpenOutlet={() => navigate('/')}
        onSignIn={() => {
          setSessionVersion((value) => value + 1);
          navigate('/platform');
        }}
      />
    );
  }

  const clientDetailId = path.startsWith('/platform/clients/') ? decodeURIComponent(path.slice('/platform/clients/'.length)) : null;

  if (
    path === '/platform' ||
    path === '/platform/clients' ||
    path === '/platform/plans' ||
    path === '/platform/subscriptions' ||
    path === '/platform/invoices' ||
    path === '/platform/reports' ||
    clientDetailId
  ) {
    const session = readSession();
    if (!session?.accessToken || !session.platformRole) {
      return (
        <PlatformLoginPage
          onOpenOutlet={() => navigate('/')}
          onSignIn={() => {
            setSessionVersion((value) => value + 1);
            navigate('/platform');
          }}
        />
      );
    }

    const leavePlatform = () => {
      void unregisterWebPush().finally(() => {
        clearSession();
        setSessionVersion((value) => value + 1);
        navigate('/platform/login');
      });
    };
    const openPlatform = (section: PlatformSection) => {
      if (section === 'overview') navigate('/platform');
      if (section === 'clients') navigate('/platform/clients');
      if (section === 'plans') navigate('/platform/plans');
      if (section === 'subscriptions') navigate('/platform/subscriptions');
      if (section === 'invoices') navigate('/platform/invoices');
      if (section === 'reports') navigate('/platform/reports');
    };
    const openClient = (clientId: string) => navigate(`/platform/clients/${clientId}`);

    if (clientDetailId) {
      return (
        <PlatformClientDetailPage
          clientId={clientDetailId}
          onBack={() => navigate('/platform/clients')}
          onNavigate={openPlatform}
          onSignOut={leavePlatform}
        />
      );
    }

    if (path === '/platform/clients') {
      return <PlatformClientsPage onNavigate={openPlatform} onOpenClient={openClient} onSignOut={leavePlatform} />;
    }

    if (path === '/platform/plans') {
      return <PlatformPlansPage onNavigate={openPlatform} onSignOut={leavePlatform} />;
    }

    if (path === '/platform/subscriptions') {
      return <PlatformSubscriptionsPage onNavigate={openPlatform} onOpenClient={openClient} onSignOut={leavePlatform} />;
    }

    if (path === '/platform/invoices') {
      return <PlatformInvoicesPage onNavigate={openPlatform} onOpenClient={openClient} onSignOut={leavePlatform} />;
    }

    if (path === '/platform/reports') {
      return <PlatformReportsPage onNavigate={openPlatform} onSignOut={leavePlatform} />;
    }

    return <PlatformOverviewPage onNavigate={openPlatform} onOpenClient={openClient} onSignOut={leavePlatform} />;
  }

  if (screen === 'register') {
    return <RegisterPage onBack={() => setScreen('login')} onCreated={signedIn} />;
  }

  if (screen === 'admin') {
    const go = (next: AdminSection) => {
      if (next === 'today' || next === 'spot' || next === 'restaurant' || next === 'floors' || next === 'employees' || next === 'reports') {
        setBookingId(null);
        setTableRoom(null);
        setRoomFloor(null);
        setSection(next);
      }
    };

    if (section === 'restaurant') {
      return <RestaurantsPage onNavigate={go} onSignOut={signedOut} />;
    }

    if (section === 'floors') {
      if (roomFloor && tableRoom) {
        return (
          <TablesPage
            floorId={roomFloor.id}
            floorName={roomFloor.name}
            roomId={tableRoom.id}
            roomName={tableRoom.name}
            onBack={() => setTableRoom(null)}
            onBackToFloors={() => {
              setTableRoom(null);
              setRoomFloor(null);
            }}
            onNavigate={go}
            onSignOut={signedOut}
          />
        );
      }

      if (roomFloor) {
        return (
          <RoomsPage
            floorId={roomFloor.id}
            floorName={roomFloor.name}
            onBack={() => setRoomFloor(null)}
            onOpenRoom={setTableRoom}
            onNavigate={go}
            onSignOut={signedOut}
          />
        );
      }

      return (
        <FloorsPage
          onNavigate={go}
          onOpenFloor={setRoomFloor}
          onSignOut={signedOut}
        />
      );
    }

    if (section === 'reports') {
      return <ReportsPage onNavigate={go} onSignOut={signedOut} />;
    }

    if (section === 'employees') {
      return <EmployeesPage onNavigate={go} onSignOut={signedOut} />;
    }

    if (section === 'spot') {
      return (
        <SpotBookingPage
          onCancel={() => setSection('today')}
          onNavigate={go}
          onSignOut={signedOut}
        />
      );
    }

    if (bookingId) {
      return (
        <BookingDetailsPage
          bookingId={bookingId}
          onBack={() => setBookingId(null)}
          onNavigate={go}
          onSignOut={signedOut}
        />
      );
    }

    return (
      <TodayPage
        onNavigate={go}
        onNewBooking={() => setSection('spot')}
        onOpenBooking={setBookingId}
        onSignOut={signedOut}
      />
    );
  }

  return (
    <LoginPage
      onCreateAccount={() => setScreen('register')}
      onSignIn={() => {
        setSection('today');
        signedIn();
      }}
    />
  );
}
