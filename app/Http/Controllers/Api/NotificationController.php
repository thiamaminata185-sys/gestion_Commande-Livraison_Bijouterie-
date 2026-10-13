<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        return Notification::where('idUtilisateur', $request->user()->id)
            ->latest()
            ->paginate(20);
    }

    public function marquerLu(Request $request, $id)
    {
        $notif = Notification::where('idNotification', $id)
            ->where('idUtilisateur', $request->user()->id)
            ->firstOrFail();

        $notif->marquerCommeLu();
        return $notif;
    }

    public function marquerToutLu(Request $request)
    {
        Notification::where('idUtilisateur', $request->user()->id)
            ->where('lu', false)
            ->update(['lu' => true]);

        return response()->json(['message' => 'Toutes les notifications sont lues']);
    }
}