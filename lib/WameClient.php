<?php

/**
 * WameClient - Adaptador de comunicação com a WAME API.
 * 
 * NOTA: Esta classe utiliza autenticação via URL (/{key}/{resource}),
 * conforme documentação oficial da WAME.
 */
class WameClient {
    private $baseUrl;
    private $instanceKey;

    public function __construct($baseUrl, $instanceKey) {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->instanceKey = $instanceKey;
    }

    private function request($method, $resource, $payload = []) {
        // Estrutura oficial: /{key}/{resource}
        $url = $this->baseUrl . '/' . $this->instanceKey . '/' . ltrim($resource, '/');
        $ch = curl_init($url);
        
        $headers = [
            'Content-Type: application/json'
        ];

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        
        if (!empty($payload)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 400) {
            error_log("WameClient Error: HTTP $httpCode - $response");
            return ['success' => false, 'error' => 'API Error', 'code' => $httpCode];
        }

        return json_decode($response, true);
    }

    /**
     * Envia mensagem de texto.
     * Endpoint oficial: POST /{key}/message/text
     */
    public function sendMessage($phoneNumber, $message, $provider = 'whatsapp') {
        return $this->request('POST', 'message/text', [
            'to' => $phoneNumber,
            'text' => $message,
            'provider' => $provider
        ]);
    }

    /**
     * Envia imagem.
     * Endpoint oficial: POST /{key}/message/image
     */
    public function sendImage($phoneNumber, $url, $caption = '', $provider = 'whatsapp') {
        return $this->request('POST', 'message/image', [
            'to' => $phoneNumber,
            'url' => $url,
            'caption' => $caption,
            'provider' => $provider
        ]);
    }

    /**
     * Envia áudio.
     * Endpoint oficial: POST /{key}/message/audio
     */
    public function sendAudio($phoneNumber, $url, $provider = 'whatsapp') {
        return $this->request('POST', 'message/audio', [
            'to' => $phoneNumber,
            'url' => $url,
            'provider' => $provider
        ]);
    }

    /**
     * Envia vídeo.
     * Endpoint oficial: POST /{key}/message/video
     */
    public function sendVideo($phoneNumber, $url, $caption = '', $provider = 'whatsapp') {
        return $this->request('POST', 'message/video', [
            'to' => $phoneNumber,
            'url' => $url,
            'caption' => $caption,
            'provider' => $provider
        ]);
    }

    /**
     * Envia documento.
     * Endpoint oficial: POST /{key}/message/document
     */
    public function sendDocument($phoneNumber, $url, $mimetype, $fileName, $provider = 'whatsapp') {
        return $this->request('POST', 'message/document', [
            'to' => $phoneNumber,
            'url' => $url,
            'mimetype' => $mimetype,
            'fileName' => $fileName,
            'provider' => $provider
        ]);
    }

    /**
     * Consulta mensagem.
     * Endpoint oficial: GET /{key}/message/{messageId}
     */
    public function getMessage($messageId) {
        return $this->request('GET', 'message/' . $messageId);
    }

    /**
     * Download de mídia.
     * Endpoint oficial: GET /{key}/message/{messageId}/media
     */
    public function getMessageMedia($messageId, $format = 'json') {
        return $this->request('GET', 'message/' . $messageId . '/media?format=' . $format);
    }

    /**
     * Consulta status da instância.
     * Endpoint oficial: GET /{key}/instance
     */
    public function getInstanceStatus() {
        return $this->request('GET', 'instance');
    }
}
